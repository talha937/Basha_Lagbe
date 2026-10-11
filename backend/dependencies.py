from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from database import get_db
from models import Property, User
from security import decode_access_token

bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    unauthorized = HTTPException(
        status_code=401, detail="Please log in again", headers={"WWW-Authenticate": "Bearer"}
    )
    if creds is None:
        raise unauthorized
    user_id = decode_access_token(creds.credentials)
    if user_id is None:
        raise unauthorized
    user = db.get(User, user_id)
    if user is None or not user.is_active:
        raise unauthorized
    return user


def require_landlord(user: User = Depends(get_current_user)) -> User:
    if user.role != "landlord":
        raise HTTPException(status_code=403, detail="Landlord account required")
    return user


def get_owned_property(
    property_id: int,
    user: User = Depends(require_landlord),
    db: Session = Depends(get_db),
) -> Property:
    """The ownership gate. Another landlord's property returns 404, exactly like a missing one,
    so changing an ID in the URL reveals nothing and changes nothing."""
    prop = (
        db.query(Property)
        .filter(
            Property.id == property_id,
            Property.owner_id == user.id,
            Property.status != "removed",
        )
        .first()
    )
    if prop is None:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop
def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user