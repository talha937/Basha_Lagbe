from datetime import datetime, timezone
from typing import Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from dependencies import require_admin
from models import ListingReport, ListingReview, Property, User
from schemas import (
    AdminPropertyOut,
    AdminReportOut,
    AdminSummary,
    RejectIn,
    ResolveReportIn,
    ReviewNote,
    VerifyIn,
)
from visibility import new_expiry

# The router-level dependency means NO endpoint here can ever forget the admin check.
router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])


def _listing_for_review(db: Session, property_id: int, admin: User) -> Property:
    prop = db.query(Property).filter(Property.id == property_id, Property.status != "removed").first()
    if prop is None:
        raise HTTPException(status_code=404, detail="Listing not found")
    if prop.owner_id == admin.id:
        raise HTTPException(status_code=403, detail="You cannot review your own listing")
    return prop


def _log(db: Session, prop: Property, admin: User, kind: str, decision: str,
         note: Optional[str] = None, method: Optional[str] = None) -> None:
    db.add(ListingReview(
        property_id=prop.id, reviewer_id=admin.id, kind=kind,
        decision=decision, method=method, note=note,
    ))


def _open_report_counts(db: Session, property_ids) -> dict:
    ids = list(property_ids)
    if not ids:
        return {}
    rows = (
        db.query(ListingReport.property_id, func.count(ListingReport.id))
        .filter(ListingReport.property_id.in_(ids), ListingReport.status == "open")
        .group_by(ListingReport.property_id)
        .all()
    )
    return dict(rows)


def _listing_views(db: Session, props: list[Property]) -> list[AdminPropertyOut]:
    owner_ids = {p.owner_id for p in props if p.owner_id}
    owners = {}
    if owner_ids:
        owners = {u.id: u for u in db.query(User).filter(User.id.in_(owner_ids)).all()}
    counts = _open_report_counts(db, [p.id for p in props])

    views = []
    for p in props:
        view = AdminPropertyOut.model_validate(p)
        owner = owners.get(p.owner_id)
        view.owner_name = owner.name if owner else None
        view.owner_phone = owner.phone if owner else None
        view.open_report_count = counts.get(p.id, 0)
        views.append(view)
    return views


def _report_views(db: Session, reports: list[ListingReport]) -> list[AdminReportOut]:
    counts = _open_report_counts(db, {r.property_id for r in reports})
    return [
        AdminReportOut(
            id=r.id,
            property_id=r.property_id,
            property_title=r.property_ref.title,
            property_moderation_status=r.property_ref.moderation_status,
            reporter_name=r.reporter.name,
            reason=r.reason,
            details=r.details,
            status=r.status,
            created_at=r.created_at,
            reviewed_at=r.reviewed_at,
            resolution_note=r.resolution_note,
            open_reports_for_listing=counts.get(r.property_id, 0),
        )
        for r in reports
    ]


# ---------- Overview ----------
@router.get("/summary", response_model=AdminSummary)
def summary(db: Session = Depends(get_db)):
    pending = (
        db.query(Property)
        .filter(Property.moderation_status == "pending_review", Property.status != "removed")
        .count()
    )
    open_reports = db.query(ListingReport).filter(ListingReport.status == "open").count()
    return AdminSummary(pending_listings=pending, open_reports=open_reports)


# ---------- Listing review ----------
@router.get("/listings", response_model=list[AdminPropertyOut])
def list_listings(
    moderation: Literal["pending_review", "approved", "rejected"] = Query("pending_review"),
    db: Session = Depends(get_db),
):
    query = db.query(Property).filter(Property.moderation_status == moderation, Property.status != "removed")
    order = Property.updated_at.asc() if moderation == "pending_review" else Property.updated_at.desc()
    return _listing_views(db, query.order_by(order).limit(100).all())


@router.post("/listings/{property_id}/approve", response_model=AdminPropertyOut)
def approve_listing(
    property_id: int,
    data: Optional[ReviewNote] = None,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    prop = _listing_for_review(db, property_id, admin)
    prop.moderation_status = "approved"
    prop.moderation_note = None
    prop.expires_at = new_expiry()  # the 30-day clock starts when the listing goes public
    _log(db, prop, admin, "moderation", "approved", data.note if data else None)
    db.commit()
    db.refresh(prop)
    return _listing_views(db, [prop])[0]


@router.post("/listings/{property_id}/reject", response_model=AdminPropertyOut)
def reject_listing(
    property_id: int,
    data: RejectIn,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    prop = _listing_for_review(db, property_id, admin)
    prop.moderation_status = "rejected"
    prop.moderation_note = data.note  # the landlord sees this, so write it for them
    prop.verification_status = "unverified"
    prop.verified_at = None
    _log(db, prop, admin, "moderation", "rejected", data.note)
    db.commit()
    db.refresh(prop)
    return _listing_views(db, [prop])[0]


# ---------- Verification (separate from approval) ----------
@router.post("/listings/{property_id}/verify", response_model=AdminPropertyOut)
def verify_listing(
    property_id: int,
    data: VerifyIn,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    prop = _listing_for_review(db, property_id, admin)
    if prop.moderation_status != "approved":
        raise HTTPException(status_code=409, detail="Approve the listing before verifying it")
    if prop.verification_status == "verified":
        raise HTTPException(status_code=409, detail="This listing is already verified")
    prop.verification_status = "verified"
    prop.verified_at = datetime.now(timezone.utc)
    _log(db, prop, admin, "verification", "verified", data.note, data.method)
    db.commit()
    db.refresh(prop)
    return _listing_views(db, [prop])[0]


@router.post("/listings/{property_id}/unverify", response_model=AdminPropertyOut)
def unverify_listing(
    property_id: int,
    data: RejectIn,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    prop = _listing_for_review(db, property_id, admin)
    if prop.verification_status != "verified":
        raise HTTPException(status_code=409, detail="This listing is not verified")
    prop.verification_status = "unverified"
    prop.verified_at = None
    _log(db, prop, admin, "verification", "unverified", data.note)
    db.commit()
    db.refresh(prop)
    return _listing_views(db, [prop])[0]


# ---------- Reports ----------
@router.get("/reports", response_model=list[AdminReportOut])
def list_reports(
    status: Literal["open", "dismissed", "action_taken"] = Query("open"),
    db: Session = Depends(get_db),
):
    order = ListingReport.created_at.asc() if status == "open" else ListingReport.reviewed_at.desc()
    rows = db.query(ListingReport).filter(ListingReport.status == status).order_by(order).limit(100).all()
    return _report_views(db, rows)


@router.post("/reports/{report_id}/resolve", response_model=AdminReportOut)
def resolve_report(
    report_id: int,
    data: ResolveReportIn,
    admin: User = Depends(require_admin),
    db: Session = Depends(get_db),
):
    report = db.get(ListingReport, report_id)
    if report is None:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status != "open":
        raise HTTPException(status_code=409, detail=f"This report was already {report.status}")

    report.status = data.outcome
    report.reviewed_by = admin.id
    report.reviewed_at = datetime.now(timezone.utc)
    report.resolution_note = data.note

    if data.unpublish:
        prop = report.property_ref
        if prop.owner_id == admin.id:
            raise HTTPException(status_code=403, detail="You cannot review your own listing")
        prop.moderation_status = "rejected"
        prop.moderation_note = data.note
        prop.verification_status = "unverified"
        prop.verified_at = None
        _log(db, prop, admin, "moderation", "unpublished", data.note)
        # close every other open report on this listing in the same transaction
        (
            db.query(ListingReport)
            .filter(
                ListingReport.property_id == prop.id,
                ListingReport.status == "open",
                ListingReport.id != report.id,
            )
            .update(
                {
                    "status": "action_taken",
                    "reviewed_by": admin.id,
                    "reviewed_at": func.now(),
                    "resolution_note": "Closed together with the listing removal",
                },
                synchronize_session=False,
            )
        )

    db.commit()
    db.refresh(report)
    return _report_views(db, [report])[0]