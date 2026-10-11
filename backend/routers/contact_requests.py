from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from database import get_db
from dependencies import get_current_user, require_landlord
from limiter import limiter
from models import ContactRequest, Property, User
from schemas import (
    ContactDecision,
    ContactRequestCreate,
    ContactRequestLandlordOut,
    ContactRequestTenantOut,
    PropertySummary,
)
from visibility import public_filters

router = APIRouter(tags=["contact requests"])

MAX_PENDING_PER_TENANT = 20


def tenant_view(cr: ContactRequest) -> ContactRequestTenantOut:
    """Landlord details appear only after acceptance. Enforced here, not in the UI."""
    accepted = cr.status == "accepted"
    return ContactRequestTenantOut(
        id=cr.id,
        status=cr.status,
        message=cr.message,
        created_at=cr.created_at,
        responded_at=cr.responded_at,
        listing=PropertySummary.model_validate(cr.property_ref),
        landlord_name=cr.landlord.name if accepted else None,
        landlord_phone=cr.landlord.phone if accepted else None,
    )


def landlord_view(cr: ContactRequest) -> ContactRequestLandlordOut:
    accepted = cr.status == "accepted"
    return ContactRequestLandlordOut(
        id=cr.id,
        property_id=cr.property_id,
        property_title=cr.property_ref.title,
        tenant_name=cr.tenant.name,
        tenant_phone=cr.tenant.phone if accepted else None,
        message=cr.message,
        status=cr.status,
        created_at=cr.created_at,
        responded_at=cr.responded_at,
    )


@router.post("/contact-requests", response_model=ContactRequestTenantOut, status_code=201)
@limiter.limit("10/hour")
def create_contact_request(
    request: Request,
    data: ContactRequestCreate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    prop = db.query(Property).filter(Property.id == data.property_id, *public_filters()).first()
    if prop is None or prop.owner_id is None:
        raise HTTPException(status_code=404, detail="Property not found or no longer available")
    if prop.owner_id == user.id:
        raise HTTPException(status_code=400, detail="You cannot send a request for your own listing")

    pending = (
        db.query(ContactRequest)
        .filter(ContactRequest.tenant_id == user.id, ContactRequest.status == "pending")
        .count()
    )
    if pending >= MAX_PENDING_PER_TENANT:
        raise HTTPException(status_code=400, detail="Too many pending requests. Wait for landlords to reply.")

    cr = ContactRequest(
        property_id=prop.id,
        tenant_id=user.id,
        landlord_id=prop.owner_id,  # taken from the property, never from the client
        message=data.message,
    )
    db.add(cr)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="You have already sent a request for this listing")
    db.refresh(cr)
    return tenant_view(cr)


@router.get("/contact-requests/mine", response_model=list[ContactRequestTenantOut])
def my_requests(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = (
        db.query(ContactRequest)
        .filter(ContactRequest.tenant_id == user.id)
        .order_by(ContactRequest.created_at.desc())
        .limit(200)
        .all()
    )
    return [tenant_view(r) for r in rows]


@router.get("/landlord/contact-requests", response_model=list[ContactRequestLandlordOut])
def landlord_inbox(
    status: Optional[Literal["pending", "accepted", "rejected"]] = Query(None),
    user: User = Depends(require_landlord),
    db: Session = Depends(get_db),
):
    query = db.query(ContactRequest).filter(
        ContactRequest.landlord_id == user.id,
        ContactRequest.property_ref.has(Property.status != "removed"),
    )
    if status:
        query = query.filter(ContactRequest.status == status)
    return [landlord_view(r) for r in query.order_by(ContactRequest.created_at.desc()).limit(200).all()]


@router.patch("/landlord/contact-requests/{request_id}", response_model=ContactRequestLandlordOut)
def decide_request(
    request_id: int,
    data: ContactDecision,
    user: User = Depends(require_landlord),
    db: Session = Depends(get_db),
):
    # One atomic UPDATE: it only matches MY request that is STILL pending,
    # so two clicks or two tabs can never decide the same request twice.
    updated = (
        db.query(ContactRequest)
        .filter(
            ContactRequest.id == request_id,
            ContactRequest.landlord_id == user.id,
            ContactRequest.status == "pending",
        )
        .update({"status": data.status, "responded_at": func.now()}, synchronize_session=False)
    )
    if updated == 0:
        db.rollback()
        mine = (
            db.query(ContactRequest.status)
            .filter(ContactRequest.id == request_id, ContactRequest.landlord_id == user.id)
            .first()
        )
        if mine is None:
            raise HTTPException(status_code=404, detail="Request not found")
        raise HTTPException(status_code=409, detail=f"This request was already {mine[0]}")
    db.commit()

    cr = db.query(ContactRequest).filter(ContactRequest.id == request_id).one()
    return landlord_view(cr)