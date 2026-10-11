from sqlalchemy import (
    Boolean, Column, Date, DateTime, ForeignKey, Integer, String, Text, func, text,
)
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import relationship

from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    phone = Column(String(15), nullable=False, unique=True, index=True)  # normalized 01XXXXXXXXX
    email = Column(String(255), nullable=True, unique=True, index=True)
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