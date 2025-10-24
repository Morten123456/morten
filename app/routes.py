import json
import uuid
from datetime import datetime
from typing import Any, Dict, Optional

from flask import Flask, jsonify, request, send_file, send_from_directory

from . import db
from .hubspot_client import HubSpotClient
from .models import Lead, RewardCode, Spin
from .slot_logic import grid_to_json, spin_reels
from .utils import (
    available_spins_for_lead,
    count_anon_spins_today,
    hash_ip,
    start_of_next_day_ts,
)


def _get_hubspot(app: Flask) -> HubSpotClient:
    return HubSpotClient(
        private_app_token=app.config.get("HUBSPOT_PRIVATE_APP_TOKEN", ""),
        app_env=app.config.get("APP_ENV", "dev"),
    )


# Helpers

def _assign_reward_if_needed(tier: str, lead: Optional[Lead]) -> Optional[str]:
    if tier in ("grand", "large"):
        # Require code from pool; if not available, generate a placeholder
        reward = (
            RewardCode.query.filter_by(is_claimed=False).first()
        )
        if reward and lead:
            reward.is_claimed = True
            reward.claimed_by = lead.id
            reward.claimed_at = datetime.utcnow()
            db.session.add(reward)
            db.session.commit()
            return reward.code
        # fallback placeholder
        return f"DEMO-{uuid.uuid4().hex[:8].upper()}"
    return None


# Routes

def register_routes(app: Flask) -> None:
    @app.get("/admin")
    def admin_page():
        return send_from_directory(app.static_folder, "admin.html")

    @app.get("/healthz")
    def healthz():
        return jsonify({"status": "ok"})

    @app.post("/api/slot/spin_anon")
    def spin_anon():
        iphash = hash_ip(request, app.config["IP_HASH_SALT"])
        free_limit = int(app.config["FREE_ANON_SPINS_PER_DAY"]) or 1
        used_today = count_anon_spins_today(iphash)
        if used_today >= free_limit:
            return (
                jsonify({"error": "limit_reached", "next_reset_ts": start_of_next_day_ts()}),
                429,
            )

        grid, seed, is_win, tier = spin_reels()
        reels_json = grid_to_json(grid)
        anon_uuid = uuid.uuid4().hex

        spin = Spin(
            anon_uuid=anon_uuid,
            ip_hash=iphash,
            is_win=is_win,
            tier=tier,
            reels_json=reels_json,
            seed_used=seed,
        )
        db.session.add(spin)
        db.session.commit()

        return jsonify(
            {
                "anon_uuid": anon_uuid,
                "reels": json.loads(reels_json),
                "is_win": is_win,
                "tier": tier,
            }
        )

    @app.post("/api/leads/register_from_spin")
    def register_from_spin():
        payload = request.get_json() or {}
        anon_uuid = payload.get("anon_uuid")
        email = (payload.get("email") or "").strip().lower()
        name = (payload.get("name") or "").strip()
        consent = bool(payload.get("consent", False))

        if not anon_uuid or not email or not consent:
            return jsonify({"error": "invalid_input"}), 400

        spin: Optional[Spin] = Spin.query.filter_by(anon_uuid=anon_uuid).first()
        if not spin:
            return jsonify({"error": "spin_not_found"}), 404
        if spin.lead_id:
            # Already linked
            lead = Lead.query.get(spin.lead_id)
        else:
            # Upsert lead
            lead = Lead.query.filter_by(email=email).first()
            if not lead:
                lead = Lead(email=email, name=name, consent=consent, created_at=datetime.utcnow())
                db.session.add(lead)
                db.session.commit()
            else:
                lead.name = name or lead.name
                lead.consent = consent or lead.consent
                db.session.add(lead)
                db.session.commit()

            spin.lead_id = lead.id
            db.session.add(spin)
            db.session.commit()

        # Update last seen
        lead.last_seen_at = datetime.utcnow()
        db.session.add(lead)
        db.session.commit()

        # HubSpot
        hubspot = _get_hubspot(app)
        contact_id = hubspot.upsert_contact(email=email, firstname=name, lastname=None, marketing_consent=consent)
        lead.hubspot_contact_id = contact_id
        db.session.add(lead)
        db.session.commit()

        # Log event note
        if spin.is_win:
            hubspot.create_note(contact_id, f"Slot win unlocked (tier: {spin.tier})")
            if spin.tier == "grand" and app.config.get("FEATURE_CREATE_DEAL") and app.config.get("DEAL_PIPELINE_ID") and app.config.get("DEAL_STAGE_ID"):
                try:
                    hubspot.create_deal(
                        contact_id=contact_id,
                        pipeline_id=app.config.get("DEAL_PIPELINE_ID"),
                        stage_id=app.config.get("DEAL_STAGE_ID"),
                        deal_name=f"Grand win - {email}",
                    )
                except Exception:
                    pass
        else:
            hubspot.create_note(contact_id, "Slot extra spin opt-in")

        reward_code = _assign_reward_if_needed(spin.tier, lead)

        daily_limit = int(app.config["DAILY_SPIN_LIMIT"]) or 3
        spins_left = available_spins_for_lead(lead.id, daily_limit)

        response: Dict[str, Any] = {
            "is_win": spin.is_win,
            "tier": spin.tier,
            "reels": json.loads(spin.reels_json),
            "spins_left": spins_left,
        }
        if reward_code:
            response["reward_code"] = reward_code

        return jsonify(response)

    @app.post("/api/slot/spin")
    def spin_registered():
        payload = request.get_json() or {}
        email = (payload.get("email") or "").strip().lower()
        if not email:
            return jsonify({"error": "invalid_input"}), 400

        lead = Lead.query.filter_by(email=email).first()
        if not lead:
            return jsonify({"error": "lead_not_found"}), 404

        daily_limit = int(app.config["DAILY_SPIN_LIMIT"]) or 3
        left = available_spins_for_lead(lead.id, daily_limit)
        if left <= 0:
            return (
                jsonify({"error": "limit_reached", "next_reset_ts": start_of_next_day_ts()}),
                429,
            )

        grid, seed, is_win, tier = spin_reels()
        reels_json = grid_to_json(grid)

        spin = Spin(
            lead_id=lead.id,
            ip_hash=None,
            is_win=is_win,
            tier=tier,
            reels_json=reels_json,
            seed_used=seed,
        )
        db.session.add(spin)
        db.session.commit()

        # Update last seen
        lead.last_seen_at = datetime.utcnow()
        db.session.add(lead)
        db.session.commit()

        reward_code = _assign_reward_if_needed(tier, lead)

        hubspot = _get_hubspot(app)
        if is_win:
            hubspot.create_note(lead.hubspot_contact_id or "", f"Slot win (tier: {tier})")
            if tier == "grand" and app.config.get("FEATURE_CREATE_DEAL") and app.config.get("DEAL_PIPELINE_ID") and app.config.get("DEAL_STAGE_ID"):
                try:
                    hubspot.create_deal(
                        contact_id=(lead.hubspot_contact_id or ""),
                        pipeline_id=app.config.get("DEAL_PIPELINE_ID"),
                        stage_id=app.config.get("DEAL_STAGE_ID"),
                        deal_name=f"Grand win - {lead.email}",
                    )
                except Exception:
                    pass

        left_after = available_spins_for_lead(lead.id, daily_limit)

        response = {
            "reels": json.loads(reels_json),
            "is_win": is_win,
            "tier": tier,
            "spins_left": left_after,
        }
        if reward_code:
            response["reward_code"] = reward_code

        return jsonify(response)

    def _require_admin() -> Optional[tuple]:
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return jsonify({"error": "unauthorized"}), 401
        token = auth.split(" ", 1)[1].strip()
        if not token or token != app.config.get("ADMIN_TOKEN"):
            return jsonify({"error": "forbidden"}), 403
        return None

    @app.get("/api/admin/leads")
    def admin_leads():
        auth_error = _require_admin()
        if auth_error:
            return auth_error

        leads = Lead.query.all()
        rows = []
        for l in leads:
            spins_count = Spin.query.filter_by(lead_id=l.id).count()
            wins_count = Spin.query.filter_by(lead_id=l.id, is_win=True).count()
            rows.append(
                {
                    "email": l.email,
                    "name": l.name,
                    "consent": l.consent,
                    "hubspot_contact_id": l.hubspot_contact_id,
                    "created_at": l.created_at.isoformat() if l.created_at else None,
                    "last_seen_at": l.last_seen_at.isoformat() if l.last_seen_at else None,
                    "spins_count": spins_count,
                    "wins_count": wins_count,
                }
            )
        return jsonify({"leads": rows})

    @app.get("/api/admin/export.csv")
    def admin_export_csv():
        auth_error = _require_admin()
        if auth_error:
            return auth_error

        import csv
        import io

        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow([
            "email",
            "name",
            "consent",
            "hubspot_contact_id",
            "created_at",
            "last_seen_at",
            "spins_count",
            "wins_count",
        ])
        for l in Lead.query.all():
            spins_count = Spin.query.filter_by(lead_id=l.id).count()
            wins_count = Spin.query.filter_by(lead_id=l.id, is_win=True).count()
            writer.writerow([
                l.email,
                l.name or "",
                int(bool(l.consent)),
                l.hubspot_contact_id or "",
                l.created_at.isoformat() if l.created_at else "",
                l.last_seen_at.isoformat() if l.last_seen_at else "",
                spins_count,
                wins_count,
            ])
        output.seek(0)

        return send_file(
            io.BytesIO(output.getvalue().encode("utf-8")),
            mimetype="text/csv",
            as_attachment=True,
            download_name="export.csv",
        )
