from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Property
from schemas import PropertyOut

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("", response_model=list[PropertyOut])
def list_properties(
    area: Optional[str] = Query(None, max_length=100),
    min_rent: Optional[int] = Query(None, ge=0),
    max_rent: Optional[int] = Query(None, ge=0),
    db: Session = Depends(get_db),
):
    if min_rent is not None and max_rent is not None and min_rent > max_rent:
        raise HTTPException(status_code=422, detail="min_rent cannot be greater than max_rent")

    query = db.query(Property).filter(Property.is_available.is_(True))

    if area:
        query = query.filter(func.lower(Property.area) == area.strip().lower())
    if min_rent is not None:
        query = query.filter(Property.rent >= min_rent)
    if max_rent is not None:
        query = query.filter(Property.rent <= max_rent)

    return query.order_by(Property.created_at.desc()).all()