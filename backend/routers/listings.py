from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Property
from schemas import PropertyOut

router = APIRouter(prefix="/properties", tags=["properties"])


@router.get("", response_model=list[PropertyOut])
def list_properties(
    area_id: Optional[int] = Query(None, ge=1),
    min_rent: Optional[int] = Query(None, ge=0),
    max_rent: Optional[int] = Query(None, ge=0),
    db: Session = Depends(get_db),
):
    if min_rent is not None and max_rent is not None and min_rent > max_rent:
        raise HTTPException(status_code=422, detail="min_rent cannot be greater than max_rent")

    query = db.query(Property).filter(Property.is_available.is_(True))

    if area_id is not None:
        query = query.filter(Property.area_id == area_id)
    if min_rent is not None:
        query = query.filter(Property.rent >= min_rent)
    if max_rent is not None:
        query = query.filter(Property.rent <= max_rent)

    return query.order_by(Property.created_at.desc()).all()


@router.get("/{property_id}", response_model=PropertyOut)
def get_property(property_id: int, db: Session = Depends(get_db)):
    prop = (
        db.query(Property)
        .filter(Property.id == property_id, Property.is_available.is_(True))
        .first()
    )
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")
    return prop