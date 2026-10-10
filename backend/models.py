from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func,
)
from database import Base


class Property(Base):
    __tablename__ = "properties"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(150), nullable=False)
    area = Column(String(100), nullable=False, index=True)
    rent = Column(Integer, nullable=False, index=True)
    bedrooms = Column(Integer, nullable=False, default=1)
    bathrooms = Column(Integer, nullable=False, default=1)
    sqft = Column(Integer, nullable=True)
    description = Column(Text, nullable=False)
    image_url = Column(String(500), nullable=True)
    is_available = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


class Inquiry(Base):
    __tablename__ = "inquiries"

    id = Column(Integer, primary_key=True, index=True)
    property_id = Column(Integer, ForeignKey("properties.id"), nullable=False, index=True)
    name = Column(String(100), nullable=False)
    contact = Column(String(100), nullable=False)
    message = Column(String(1000), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)