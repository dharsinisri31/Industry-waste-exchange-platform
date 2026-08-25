from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app import models
from app.utils.security import get_current_user
from app.schemas.industry_schema import IndustryUpdate
from app.routers.waste import calculate_distance

router = APIRouter()

def serialize_industry(profile: models.Industry, email: str = "") -> dict:
    return {
        "_id": str(profile.id),
        "user": {
            "_id": str(profile.user_id),
            "email": email
        } if email else str(profile.user_id),
        "companyName": profile.company_name,
        "registrationNumber": profile.registration_number,
        "address": profile.address,
        "city": profile.city,
        "contactPhone": profile.contact_phone,
        "industryType": profile.industry_type,
        "description": profile.description,
        "carbonSaved": profile.carbon_saved,
        "revenue": profile.revenue,
        "location": profile.location
    }

@router.get("/dashboard")
async def get_dashboard_metrics(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    profile = db.query(models.Industry).filter(models.Industry.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Industry profile not found")

    try:
        # 1. Uploaded Waste count
        uploaded_waste_count = db.query(models.Waste).filter(models.Waste.uploader_id == current_user.id).count()

        # 2. Completed sales where user is seller (for revenue)
        completed_sales = db.query(models.Transaction).filter(
            models.Transaction.seller_id == current_user.id,
            models.Transaction.status == "completed"
        ).all()
        revenue = sum(trans.total_price for trans in completed_sales)

        # 3. Total carbon saved (sum from completed transactions where user is seller or buyer)
        completed_transactions = db.query(models.Transaction).filter(
            or_(models.Transaction.seller_id == current_user.id, models.Transaction.buyer_id == current_user.id),
            models.Transaction.status == "completed"
        ).all()
        carbon_saved = sum(trans.carbon_saved_kg for trans in completed_transactions)

        # 4. Pending transaction requests
        pending_transactions = db.query(models.Transaction).filter(
            or_(models.Transaction.seller_id == current_user.id, models.Transaction.buyer_id == current_user.id),
            models.Transaction.status == "pending"
        ).all()

        # 5. Nearby Industries (within 100km)
        all_other_industries = db.query(models.Industry).filter(models.Industry.user_id != current_user.id).all()
        user_coords = [profile.longitude, profile.latitude]
        
        nearby = []
        for other in all_other_industries:
            dist = calculate_distance(user_coords, [other.longitude, other.latitude])
            if dist <= 100.0:  # 100km
                other.distance = dist
                nearby.append(other)
        
        nearby.sort(key=lambda x: x.distance)
        nearby_serialized = [serialize_industry(ind) for ind in nearby[:5]]

        # Update profile stats
        profile.carbon_saved = carbon_saved
        profile.revenue = revenue
        db.commit()

        return {
            "profile": serialize_industry(profile),
            "metrics": {
                "uploadedWasteCount": uploaded_waste_count,
                "revenue": revenue,
                "carbonSaved": carbon_saved,
                "pendingCount": len(pending_transactions),
                "completedCount": len(completed_transactions)
            },
            "nearbyIndustries": nearby_serialized
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/profile")
async def update_profile(
    req: IndustryUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    profile = db.query(models.Industry).filter(models.Industry.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        if req.company_name is not None:
            profile.company_name = req.company_name
        if req.address is not None:
            profile.address = req.address
        if req.city is not None:
            profile.city = req.city
        if req.contact_phone is not None:
            profile.contact_phone = req.contact_phone
        if req.industry_type is not None:
            profile.industry_type = req.industry_type
        if req.description is not None:
            profile.description = req.description
        if req.latitude is not None:
            profile.latitude = req.latitude
        if req.longitude is not None:
            profile.longitude = req.longitude

        db.commit()
        db.refresh(profile)
        return serialize_industry(profile)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/nearby")
async def get_nearby_industries(
    distance: float = Query(50.0),  # default 50km
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    profile = db.query(models.Industry).filter(models.Industry.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    try:
        all_other_industries = db.query(models.Industry).filter(models.Industry.user_id != current_user.id).all()
        user_coords = [profile.longitude, profile.latitude]
        
        nearby = []
        for other in all_other_industries:
            dist = calculate_distance(user_coords, [other.longitude, other.latitude])
            if dist <= distance:
                other.distance = dist
                nearby.append(other)
        
        nearby.sort(key=lambda x: x.distance)
        
        serialized_nearby = []
        for other in nearby:
            user_obj = db.query(models.User).filter(models.User.id == other.user_id).first()
            email = user_obj.email if user_obj else ""
            serialized_nearby.append(serialize_industry(other, email))
            
        return serialized_nearby
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
