from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user
from limiter import limiter
from models import ListingReport, Property, User
from schemas import MessageOut, ReportCreate
from visibility import public_filters

router = APIRouter(tags=["reports"])


@router.post("/properties/{property_id}/report", response_model=MessageOut, status_code=201)
@limiter.limit("10/hour")
def report_listing(
    request: Request,
    property_id: int,
    data: ReportCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.id == property_id, *public_filters()).first()
    if prop is None:
        raise HTTPException(status_code=404, detail="Property not found")
    if prop.owner_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot report your own listing")

    db.add(ListingReport(property_id=prop.id, reporter_id=user.id, reason=data.reason, details=data.details))
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already reported this listing")
    return MessageOut(detail="Report received. Our team will review it.")