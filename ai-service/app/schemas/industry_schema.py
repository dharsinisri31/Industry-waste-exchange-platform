from pydantic import BaseModel, Field
from typing import Optional, List

class LocationSchema(BaseModel):
    type: str = "Point"
    coordinates: List[float]  # [longitude, latitude]

class IndustryBase(BaseModel):
    company_name: str = Field(..., alias="companyName")
    registration_number: str = Field(..., alias="registrationNumber")
    address: str
    city: str
    contact_phone: str = Field(..., alias="contactPhone")
    industry_type: str = Field(..., alias="industryType")
    description: Optional[str] = None
    location: Optional[LocationSchema] = None

    class Config:
        populate_by_name = True
        from_attributes = True

class IndustryRegister(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    company_name: str = Field(..., alias="companyName")
    registration_number: str = Field(..., alias="registrationNumber")
    address: str
    city: str
    latitude: float
    longitude: float
    contact_phone: str = Field(..., alias="contactPhone")
    industry_type: str = Field(..., alias="industryType")
    description: Optional[str] = None

    class Config:
        populate_by_name = True

class IndustryUpdate(BaseModel):
    company_name: Optional[str] = Field(None, alias="companyName")
    registration_number: Optional[str] = Field(None, alias="registrationNumber")
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    contact_phone: Optional[str] = Field(None, alias="contactPhone")
    industry_type: Optional[str] = Field(None, alias="industryType")
    description: Optional[str] = None

    class Config:
        populate_by_name = True

class IndustryResponse(IndustryBase):
    id: str = Field(..., alias="_id")
    user: str = Field(..., alias="user", validation_alias="user_str")
    carbon_saved: float = Field(0.0, alias="carbonSaved")
    revenue: float = Field(0.0, alias="revenue")

    class Config:
        populate_by_name = True
        from_attributes = True
