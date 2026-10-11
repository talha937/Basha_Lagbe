from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from database import get_db
from limiter import limiter
from models import Inquiry, Property
from schemas import InquiryCreate, InquiryOut
from visibility import public_filters

router = APIRouter(prefix="/inquiries", tags=["inquiries"])


@router.post("", response_model=InquiryOut, status_code=201)
@limiter.limit("5/minute")
def create_inquiry(request: Request, data: InquiryCreate, db: Session = Depends(get_db)):
    prop = (
        db.query(Property)
        .filter(Property.id == data.property_id, *public_filters())
        .first()
    )
    if not prop:
        raise HTTPException(status_code=404, detail="Property not found")

    inquiry = Inquiry(**data.model_dump())
    db.add(inquiry)
    db.commit()
    db.refresh(inquiry)
    return InquiryOut(id=inquiry.id, detail="Inquiry received")