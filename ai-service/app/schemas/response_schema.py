from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime
from app.schemas.industry_schema import IndustryResponse

class UserResponse(BaseModel):
    id: int
    email: str
    role: str
    is_verified: bool = Field(..., alias="isVerified")

    class Config:
        populate_by_name = True
        from_attributes = True

class AdminRegister(BaseModel):
    email: str
    password: str = Field(..., min_length=6)
    full_name: str = Field(..., alias="fullName")
    phone: Optional[str] = None
    admin_secret: str = Field(..., alias="adminRegistrationSecret")

    class Config:
        populate_by_name = True

class AdminResponse(BaseModel):
    id: int
    user_id: int = Field(..., alias="userId")
    full_name: str = Field(..., alias="fullName")
    phone: Optional[str] = None

    class Config:
        populate_by_name = True
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str = Field(..., alias="accessToken")
    refresh_token: str = Field(..., alias="refreshToken")
    token_type: str = Field("bearer", alias="tokenType")
    user: UserResponse
    profile: Optional[Any] = None

    class Config:
        populate_by_name = True

class NotificationResponse(BaseModel):
    id: int
    recipient_id: int = Field(..., alias="recipient")
    title: str
    message: str
    type: str
    is_read: bool = Field(..., alias="isRead")
    created_at: datetime = Field(..., alias="createdAt")

    class Config:
        populate_by_name = True
        from_attributes = True

# Minimal waste response for embedding inside transaction
class TransactionWaste(BaseModel):
    id: int
    name: str
    category: str
    unit: str

    class Config:
        from_attributes = True

class TransactionResponse(BaseModel):
    id: int
    waste: TransactionWaste
    seller: UserResponse
    buyer: UserResponse
    quantity: float
    total_price: float = Field(..., alias="totalPrice")
    status: str
    distance_km: float = Field(..., alias="distanceKm")
    carbon_saved_kg: float = Field(..., alias="carbonSavedKg")
    transport_cost: float = Field(..., alias="transportCost")
    created_at: datetime = Field(..., alias="createdAt")
    updated_at: datetime = Field(..., alias="updatedAt")

    class Config:
        populate_by_name = True
        from_attributes = True

class CarbonReportResponse(BaseModel):
    id: int
    total_carbon_saved: float = Field(..., alias="totalCarbonSaved")
    transport_emissions: float = Field(..., alias="transportEmissions")
    reuse_emissions: float = Field(..., alias="reuseEmissions")
    net_savings: float = Field(..., alias="netSavings")

    class Config:
        populate_by_name = True
        from_attributes = True
