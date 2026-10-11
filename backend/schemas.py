import re
from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

PropertyType = Literal["flat", "room", "sublet", "studio", "mess"]
TenantType = Literal["any", "family", "bachelor_male", "bachelor_female"]
Facility = Literal["lift", "generator", "gas", "parking", "security", "cctv", "wifi", "balcony", "rooftop"]

_BD_MOBILE = re.compile(r"^01[3-9]\d{8}$")
_BN_DIGITS = str.maketrans("০১২৩৪৫৬৭৮৯", "0123456789")


def normalize_phone(value: str) -> str:
    """01712345678, +8801712345678, 8801712345678 and Bangla digits all become 01712345678."""
    digits = re.sub(r"[\s\-()]", "", value.translate(_BN_DIGITS))
    if digits.startswith("+88"):
        digits = digits[3:]
    elif digits.startswith("88") and len(digits) == 13:
        digits = digits[2:]
    if not _BD_MOBILE.match(digits):
        raise ValueError("Enter a valid Bangladeshi mobile number, e.g. 01712345678")
    return digits


# ---------- Auth ----------
class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=100)
    phone: str
    email: Optional[EmailStr] = None
    password: str = Field(min_length=8, max_length=128)

    @field_validator("name", mode="before")
    @classmethod
    def _strip_name(cls, v):
        return v.strip() if isinstance(v, str) else v

    @field_validator("email", mode="before")
    @classmethod
    def _empty_email(cls, v):
        return None if v == "" else v

    @field_validator("phone")
    @classmethod
    def _phone(cls, v):
        return normalize_phone(v)


class LoginIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    identifier: str = Field(min_length=3, max_length=255)  # mobile or email
    password: str = Field(min_length=1, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    phone: str
    email: Optional[str] = None
    role: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Areas ----------
class AreaOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    thana: str
    slug: str


# ---------- Properties ----------
class ImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    url: str
    sort_order: int


class PropertyOut(BaseModel):
    """Public view. Never includes owner details."""
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    area_id: int
    area: str
    property_type: str
    tenant_type: str
    rent: int
    service_charge: int
    advance_months: int
    bedrooms: int
    bathrooms: int
    sqft: Optional[int] = None
    floor: Optional[int] = None
    available_from: Optional[date] = None
    facilities: list[str]
    description: str
    image_url: Optional[str] = None
    images: list[ImageOut] = []
    created_at: datetime


class LandlordPropertyOut(PropertyOut):
    status: str
    updated_at: datetime


class PropertyBase(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    title: str = Field(min_length=5, max_length=150)
    area_id: int = Field(ge=1)
    property_type: PropertyType = "flat"
    tenant_type: TenantType = "any"
    rent: int = Field(ge=1000, le=1_000_000)
    service_charge: int = Field(0, ge=0, le=100_000)
    advance_months: int = Field(2, ge=0, le=12)
    bedrooms: int = Field(ge=1, le=20)
    bathrooms: int = Field(ge=1, le=20)
    sqft: Optional[int] = Field(None, ge=50, le=50_000)
    floor: Optional[int] = Field(None, ge=0, le=100)
    available_from: Optional[date] = None
    facilities: list[Facility] = Field(default_factory=list, max_length=20)
    description: str = Field(min_length=10, max_length=3000)

    @field_validator("facilities")
    @classmethod
    def _dedupe(cls, v):
        return list(dict.fromkeys(v))


# ---------- Inquiries ----------
class InquiryCreate(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    property_id: int
    name: str = Field(min_length=2, max_length=100)
    contact: str = Field(min_length=5, max_length=100)
    message: str = Field(min_length=2, max_length=1000)


class InquiryOut(BaseModel):
    id: int
    detail: str