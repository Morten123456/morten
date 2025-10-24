import hashlib
import os
from datetime import datetime, timedelta, timezone
from typing import Optional

from flask import Request
from .models import Lead, Spin
from . import db


def hash_ip(request: Request, salt: str) -> str:
    remote_addr = request.headers.get("X-Forwarded-For", request.remote_addr or "")
    user_agent = request.headers.get("User-Agent", "")
    payload = f"{remote_addr}|{user_agent}|{salt}".encode("utf-8")
    return hashlib.sha256(payload).hexdigest()


def start_of_next_day_ts() -> int:
    now = datetime.now(timezone.utc)
    tomorrow = (now + timedelta(days=1)).date()
    next_midnight = datetime.combine(tomorrow, datetime.min.time(), tzinfo=timezone.utc)
    return int(next_midnight.timestamp())


def count_anon_spins_today(ip_hash: str) -> int:
    from sqlalchemy import func
    today = datetime.utcnow().date()
    start = datetime.combine(today, datetime.min.time())
    end = datetime.combine(today, datetime.max.time())
    return (
        db.session.query(func.count(Spin.id))
        .filter(Spin.ip_hash == ip_hash, Spin.created_at >= start, Spin.created_at <= end, Spin.lead_id == None)
        .scalar()
        or 0
    )


def count_lead_spins_today(lead_id: int) -> int:
    from sqlalchemy import func
    today = datetime.utcnow().date()
    start = datetime.combine(today, datetime.min.time())
    end = datetime.combine(today, datetime.max.time())
    return (
        db.session.query(func.count(Spin.id))
        .filter(Spin.lead_id == lead_id, Spin.created_at >= start, Spin.created_at <= end)
        .scalar()
        or 0
    )


def available_spins_for_lead(lead_id: int, daily_limit: int) -> int:
    used = count_lead_spins_today(lead_id)
    left = max(0, daily_limit - used)
    return left
