from sqlalchemy import (
    Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint, func, text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False, index=True)  # normalized 01XXXXXXXXX; reusable across roles
    email = Column(String(255), nullable=True, index=True)  # reusable across roles
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="landlord", server_default="landlord")
    is_active = Column(Boolean, nullable=False, default=True, server_default=text("true"))
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Area(Base):
    __tablename__ = "areas"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    name_bn = Column(String(100), nullable=True)
    thana = Column(String(100), nullable=False, index=True)
    slug = Column(String(120), nullable=False, unique=True, index=True)
    is_active = Column(Boolean, nullable=False, default=True)


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    # nullable: the Phase 1 sample listings have no owner
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True)
    title = Column(String(150), nullable=False)
    area_id = Column(Integer, ForeignKey("areas.id"), nullable=False, index=True)
    property_type = Column(String(20), nullable=False, default="flat", server_default="flat")
    tenant_type = Column(String(20), nullable=False, default="any", server_default="any")
    rent = Column(Integer, nullable=False, index=True)
    service_charge = Column(Integer, nullable=False, default=0, server_default="0")
    advance_months = Column(Integer, nullable=False, default=2, server_default="2")
    bedrooms = Column(Integer, nullable=False, default=1)
    bathrooms = Column(Integer, nullable=False, default=1)
    sqft = Column(Integer, nullable=True)
    floor = Column(Integer, nullable=True)
    available_from = Column(Date, nullable=True)
    facilities = Column(ARRAY(String(30)), nullable=False, default=list, server_default="{}")
    description = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="available", server_default="available", index=True)
    # status: available | rented | removed
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    # Phase 3: moderation, verification, expiry
    moderation_status = Column(
        String(20), nullable=False, default="pending_review", server_default="pending_review", index=True
    )  # pending_review | approved | rejected
    moderation_note = Column(String(500), nullable=True)  # the reason shown to the landlord on rejection
    verification_status = Column(String(20), nullable=False, default="unverified", server_default="unverified")
    verified_at = Column(DateTime(timezone=True), nullable=True)
    expires_at = Column(DateTime(timezone=True), nullable=True, index=True)  # set when approved or renewed

    area_ref = relationship("Area", lazy="joined")
    images = relationship(
        "PropertyImage",
        order_by="PropertyImage.sort_order",
        cascade="all, delete-orphan",
        lazy="selectin",
    )

    @property
    def area(self) -> str:
        return self.area_ref.name

    @property
    def image_url(self):
        # the cover photo; keeps the Phase 1 cards working unchanged
        return self.images[0].url if self.images else None

    @property
    def is_verified(self) -> bool:
        return self.verification_status == "verified"

    @property
    def is_confirmed(self) -> bool:
        return self.status == "rented"


class PropertyImage(Base):
    __tablename__ = "property_images"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    storage_path = Column(String(300), nullable=False)
    url = Column(String(500), nullable=False)
    sort_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    contact = Column(String(100), nullable=False)
    message = Column(String(1000), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

class ContactRequest(Base):
    __tablename__ = "contact_requests"
    __table_args__ = (UniqueConstraint("property_id", "tenant_id", name="uq_contact_property_tenant"),)

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    tenant_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    landlord_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)  # copied from the property
    message = Column(String(500), nullable=False)
    status = Column(String(20), nullable=False, default="pending", server_default="pending", index=True)
    # status: pending | accepted | rejected
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    responded_at = Column(DateTime(timezone=True), nullable=True)

    property_ref = relationship("Property", lazy="joined")
    tenant = relationship("User", foreign_keys=[tenant_id], lazy="joined")
    landlord = relationship("User", foreign_keys=[landlord_id], lazy="joined")


class ListingReport(Base):
    __tablename__ = "listing_reports"
    __table_args__ = (UniqueConstraint("property_id", "reporter_id", name="uq_report_property_reporter"),)

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    reason = Column(String(20), nullable=False)
    details = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default="open", server_default="open", index=True)
    # status: open | dismissed | action_taken
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    resolution_note = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    property_ref = relationship("Property", lazy="joined")
    reporter = relationship("User", foreign_keys=[reporter_id], lazy="joined")


class ListingReview(Base):
    """Append-only audit trail of every admin decision on a listing."""
    __tablename__ = "listing_reviews"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    kind = Column(String(20), nullable=False)       # moderation | verification
    decision = Column(String(20), nullable=False)   # approved | rejected | unpublished | verified | unverified
    method = Column(String(30), nullable=True)      # phone_call | site_visit | ownership_document
    note = Column(String(500), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)