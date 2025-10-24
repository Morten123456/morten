from datetime import datetime
from typing import Optional
from . import db


class Lead(db.Model):
    __tablename__ = "leads"

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    name = db.Column(db.String(255))
    consent = db.Column(db.Boolean, default=False, nullable=False)
    hubspot_contact_id = db.Column(db.String(64), index=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    deleted_at = db.Column(db.DateTime)
    last_seen_at = db.Column(db.DateTime)

    spins = db.relationship("Spin", backref="lead", lazy=True)


class Spin(db.Model):
    __tablename__ = "spins"

    id = db.Column(db.Integer, primary_key=True)
    anon_uuid = db.Column(db.String(64), unique=True, index=True)
    lead_id = db.Column(db.Integer, db.ForeignKey("leads.id"), index=True)
    ip_hash = db.Column(db.String(128), index=True)

    is_win = db.Column(db.Boolean, default=False, nullable=False)
    tier = db.Column(db.String(32), default="none", nullable=False)

    reels_json = db.Column(db.Text, nullable=False)
    reward_code_id = db.Column(db.Integer, db.ForeignKey("reward_codes.id"))
    seed_used = db.Column(db.String(128), nullable=False)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)


class RewardCode(db.Model):
    __tablename__ = "reward_codes"

    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(128), unique=True, nullable=False)
    type = db.Column(db.String(32), default="coupon", nullable=False)

    is_claimed = db.Column(db.Boolean, default=False, nullable=False)
    claimed_by = db.Column(db.Integer, db.ForeignKey("leads.id"))
    claimed_at = db.Column(db.DateTime)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    spins = db.relationship("Spin", backref="reward_code", lazy=True)
