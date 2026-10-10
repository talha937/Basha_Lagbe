from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class PropertyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    area: str
    rent: int
    bedrooms: int
    bathrooms: int
    sqft: Optional[int] = None
    description: str
    image_url: Optional[str] = None
    created_at: datetime


class InquiryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    property_id: int
    name: str = Field(min_length=2, max_length=100)
    contact: str = Field(min_length=5, max_length=100)   # phone or email
    message: str = Field(min_length=2, max_length=1000)


class InquiryOut(BaseModel):
    id: int
    detail: str