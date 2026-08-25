from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class WasteBase(BaseModel):
    name: str
    category: str
    quantity: float
    unit: str
    address: str
    city: str
    latitude: float
    longitude: float
    image_url: Optional[str] = Field(None, alias="imageUrl")
    description: Optional[str] = None
    price: float

    class Config:
        populate_by_name = True
        from_attributes = True

class WasteCreate(WasteBase):
    predicted_price: Optional[float] = Field(0.0, alias="predictedPrice")

class WasteUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unit: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    image_url: Optional[str] = Field(None, alias="imageUrl")
    description: Optional[str] = None
    price: Optional[float] = None
    status: Optional[str] = None

    class Config:
        populate_by_name = True
        from_attributes = True

class WasteResponse(WasteBase):
    id: int
    uploader_id: int = Field(..., alias="uploader")
    predicted_price: float = Field(..., alias="predictedPrice")
    status: str
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True

class ExchangeRequest(BaseModel):
    quantity: float

class NearbyQuery(BaseModel):
    latitude: float
    longitude: float
    max_distance_km: float = 100.0
