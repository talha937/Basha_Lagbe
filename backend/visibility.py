from datetime import datetime, timedelta, timezone

from sqlalchemy import func

from models import Property

LISTING_LIFETIME = timedelta(days=30)


def new_expiry() -> datetime:
    return datetime.now(timezone.utc) + LISTING_LIFETIME


def public_filters():
    """A listing is public only if it is available, approved, and not expired."""
    return (
        Property.status == "available",
        Property.moderation_status == "approved",
        Property.expires_at > func.now(),
    )