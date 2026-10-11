import uuid
from typing import Literal, Optional

from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile
from sqlalchemy.orm import Session

import storage
from database import get_db
from dependencies import get_owned_property, require_landlord
from limiter import limiter
from models import Area, Inquiry, Property, PropertyImage, User
from schemas import LandlordInquiryOut, LandlordPropertyOut, PropertyBase
from visibility import new_expiry

router = APIRouter(prefix="/landlord/properties", tags=["landlord"])

MAX_LISTINGS_PER_LANDLORD = 30
# Changing any of these on a live listing sends it back to review
MATERIAL_FIELDS = ("area_id", "rent", "property_type", "bedrooms", "bathrooms")


def _check_area(db: Session, area_id: int) -> None:
    exists = db.query(Area.id).filter(Area.id == area_id, Area.is_active.is_(True)).first()
    if not exists:
        raise HTTPException(status_code=422, detail="Unknown area")


@router.get("", response_model=list[LandlordPropertyOut])
def my_properties(
    status: Optional[Literal["available", "rented"]] = Query(None),
    user: User = Depends(require_landlord),
    db: Session = Depends(get_db),
):
    query = db.query(Property).filter(Property.owner_id == user.id, Property.status != "removed")
    if status:
        query = query.filter(Property.status == status)
    return query.order_by(Property.created_at.desc()).all()


@router.post("", response_model=LandlordPropertyOut, status_code=201)
def create_property(
    data: PropertyBase,
    user: User = Depends(require_landlord),
    db: Session = Depends(get_db),
):
    _check_area(db, data.area_id)
    count = db.query(Property).filter(Property.owner_id == user.id, Property.status != "removed").count()
    if count >= MAX_LISTINGS_PER_LANDLORD:
        raise HTTPException(status_code=400, detail="Listing limit reached")
    prop = Property(owner_id=user.id, **data.model_dump())  # starts as pending_review
    db.add(prop)
    db.commit()
    db.refresh(prop)
    return prop


@router.get("/{property_id}", response_model=LandlordPropertyOut)
def get_my_property(prop: Property = Depends(get_owned_property)):
    return prop


@router.put("/{property_id}", response_model=LandlordPropertyOut)
def update_property(
    data: PropertyBase,
    prop: Property = Depends(get_owned_property),
    db: Session = Depends(get_db),
):
    _check_area(db, data.area_id)
    new_values = data.model_dump()
    material_change = any(getattr(prop, f) != new_values[f] for f in MATERIAL_FIELDS)

    for field, value in new_values.items():
        setattr(prop, field, value)

    # Rejected listings go back to the queue when fixed. Approved ones go back only
    # if something material changed, and then the verified badge no longer applies.
    if prop.moderation_status == "rejected" or (prop.moderation_status == "approved" and material_change):
        prop.moderation_status = "pending_review"
        prop.moderation_note = None
        prop.verification_status = "unverified"
        prop.verified_at = None

    db.commit()
    db.refresh(prop)
    return prop


@router.post("/{property_id}/mark-rented", response_model=LandlordPropertyOut)
def mark_rented(prop: Property = Depends(get_owned_property), db: Session = Depends(get_db)):
    prop.status = "rented"
    db.commit()
    db.refresh(prop)
    return prop


@router.post("/{property_id}/mark-available", response_model=LandlordPropertyOut)
def mark_available(prop: Property = Depends(get_owned_property), db: Session = Depends(get_db)):
    prop.status = "available"
    if prop.moderation_status == "approved":
        prop.expires_at = new_expiry()  # relisting confirms it is available again
    db.commit()
    db.refresh(prop)
    return prop


@router.post("/{property_id}/renew", response_model=LandlordPropertyOut)
def renew_listing(prop: Property = Depends(get_owned_property), db: Session = Depends(get_db)):
    if prop.moderation_status != "approved":
        raise HTTPException(status_code=409, detail="Only approved listings can be renewed")
    if prop.status != "available":
        raise HTTPException(status_code=409, detail="Mark the listing as available before renewing it")
    prop.expires_at = new_expiry()
    db.commit()
    db.refresh(prop)
    return prop


@router.delete("/{property_id}", status_code=204)
def delete_property(prop: Property = Depends(get_owned_property), db: Session = Depends(get_db)):
    """Soft delete: the row stays (requests still point to it), photos are removed."""
    paths = [img.storage_path for img in prop.images]
    prop.images.clear()
    prop.status = "removed"
    db.commit()
    for path in paths:
        storage.delete_image(path)


@router.post("/{property_id}/images", response_model=LandlordPropertyOut, status_code=201)
@limiter.limit("30/hour")
def upload_images(
    request: Request,
    files: list[UploadFile] = File(...),
    prop: Property = Depends(get_owned_property),
    db: Session = Depends(get_db),
):
    if len(prop.images) + len(files) > storage.MAX_IMAGES_PER_PROPERTY:
        raise HTTPException(
            status_code=400,
            detail=f"A listing can have at most {storage.MAX_IMAGES_PER_PROPERTY} photos",
        )

    processed = [storage.process_image(f) for f in files]  # validate ALL before uploading any

    next_order = max((i.sort_order for i in prop.images), default=-1) + 1
    uploaded: list[str] = []
    try:
        for n, data in enumerate(processed):
            path = f"properties/{prop.id}/{uuid.uuid4().hex}.webp"
            url = storage.upload_image(path, data)
            uploaded.append(path)
            db.add(PropertyImage(property_id=prop.id, storage_path=path, url=url, sort_order=next_order + n))
        db.commit()
    except Exception:
        db.rollback()
        for path in uploaded:
            storage.delete_image(path)
        raise

    db.refresh(prop)
    return prop


@router.delete("/{property_id}/images/{image_id}", status_code=204)
def delete_property_image(
    image_id: int,
    prop: Property = Depends(get_owned_property),
    db: Session = Depends(get_db),
):
    image = next((i for i in prop.images if i.id == image_id), None)
    if image is None:
        raise HTTPException(status_code=404, detail="Photo not found")
    path = image.storage_path
    db.delete(image)
    db.commit()
    storage.delete_image(path)


# Old anonymous-inquiry inbox. Stays until Part B replaces it with contact requests.
inquiries_router = APIRouter(prefix="/landlord/inquiries", tags=["landlord"])


@inquiries_router.get("", response_model=list[LandlordInquiryOut])
def my_inquiries(user: User = Depends(require_landlord), db: Session = Depends(get_db)):
    rows = (
        db.query(Inquiry, Property.title)
        .join(Property, Inquiry.property_id == Property.id)
        .filter(Property.owner_id == user.id, Property.status != "removed")
        .order_by(Inquiry.created_at.desc())
        .limit(200)
        .all()
    )
    return [
        LandlordInquiryOut(
            id=i.id, property_id=i.property_id, property_title=title,
            name=i.name, contact=i.contact, message=i.message, created_at=i.created_at,
        )
        for i, title in rows
    ]