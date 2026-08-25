from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
from app.database import get_db
from app import models
from app.utils.security import get_current_admin, get_current_user

router = APIRouter()

def serialize_user(user: models.User) -> dict:
    return {
        "_id": str(user.id),
        "email": user.email,
        "role": user.role,
        "isVerified": user.is_verified
    }

def serialize_waste(waste: models.Waste) -> dict:
    return {
        "_id": str(waste.id),
        "uploader": str(waste.uploader_id),
        "name": waste.name,
        "category": waste.category,
        "quantity": waste.quantity,
        "unit": waste.unit,
        "address": waste.address,
        "city": waste.city,
        "price": waste.price,
        "predictedPrice": waste.predicted_price,
        "status": waste.status,
        "location": waste.location
    }

def serialize_industry(profile: models.Industry) -> dict:
    return {
        "_id": str(profile.id),
        "user": str(profile.user_id),
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

def serialize_transaction(trans: models.Transaction, db: Session) -> dict:
    waste = db.query(models.Waste).filter(models.Waste.id == trans.waste_id).first()
    seller = db.query(models.User).filter(models.User.id == trans.seller_id).first()
    buyer = db.query(models.User).filter(models.User.id == trans.buyer_id).first()
    seller_profile = db.query(models.Industry).filter(models.Industry.user_id == trans.seller_id).first()
    buyer_profile = db.query(models.Industry).filter(models.Industry.user_id == trans.buyer_id).first()

    return {
        "_id": str(trans.id),
        "waste": {
            "_id": str(waste.id) if waste else str(trans.waste_id),
            "name": waste.name if waste else "Unknown Material",
            "category": waste.category if waste else "Other"
        },
        "seller": {
            "_id": str(seller.id) if seller else str(trans.seller_id),
            "email": seller.email if seller else ""
        },
        "buyer": {
            "_id": str(buyer.id) if buyer else str(trans.buyer_id),
            "email": buyer.email if buyer else ""
        },
        "quantity": trans.quantity,
        "totalPrice": trans.total_price,
        "status": trans.status,
        "distanceKm": trans.distance_km,
        "carbonSavedKg": trans.carbon_saved_kg,
        "transportCost": trans.transport_cost,
        "sellerProfile": serialize_industry(seller_profile) if seller_profile else None,
        "buyerProfile": serialize_industry(buyer_profile) if buyer_profile else None,
        "createdAt": trans.created_at.isoformat() if trans.created_at else None,
        "updatedAt": trans.updated_at.isoformat() if trans.updated_at else None
    }

@router.get("/summary")
async def get_dashboard_summary(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    try:
        total_users = db.query(models.User).count()
        total_industries = db.query(models.Industry).count()
        total_listings = db.query(models.Waste).count()
        total_transactions = db.query(models.Transaction).count()

        # Fetch latest 5 listings and exchanges
        recent_listings = db.query(models.Waste).order_by(models.Waste.created_at.desc()).limit(5).all()
        recent_transactions = db.query(models.Transaction).order_by(models.Transaction.created_at.desc()).limit(5).all()
        
        # Unverified industry accounts
        unverified_users = db.query(models.User).filter(
            models.User.role == "industry_user",
            models.User.is_verified == False
        ).all()

        pending_verifications = []
        for user in unverified_users:
            profile = db.query(models.Industry).filter(models.Industry.user_id == user.id).first()
            if profile:
                profile_dict = serialize_industry(profile)
                profile_dict["user"] = serialize_user(user)
                pending_verifications.append(profile_dict)

        return {
            "metrics": {
                "totalUsers": total_users,
                "totalIndustries": total_industries,
                "totalListings": total_listings,
                "totalTransactions": total_transactions
            },
            "recentListings": [serialize_waste(item) for item in recent_listings],
            "recentTransactions": [serialize_transaction(t, db) for t in recent_transactions],
            "pendingVerifications": pending_verifications
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/approve-industry/{id}")
async def approve_industry(id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    industry = db.query(models.Industry).filter(models.Industry.id == id).first()
    if not industry:
        raise HTTPException(status_code=404, detail="Industry profile not found")

    user = db.query(models.User).filter(models.User.id == industry.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Matching user login identity not found")

    try:
        user.is_verified = True
        
        # Trigger alert log notification
        new_notification = models.Notification(
            recipient_id=industry.user_id,
            title="Profile Verified",
            message="Congratulations! Your industry account has been verified by the administrator. You can now engage in symbiosis waste transactions.",
            type="transaction",
            is_read=False
        )
        db.add(new_notification)
        
        db.commit()
        return {"message": "Industry approved successfully", "industry": serialize_industry(industry)}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/transactions")
async def get_all_transactions(db: Session = Depends(get_db), admin: models.User = Depends(get_current_admin)):
    try:
        transactions = db.query(models.Transaction).order_by(models.Transaction.created_at.desc()).all()
        return [serialize_transaction(t, db) for t in transactions]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/transactions/{id}")
async def update_transaction_status(
    id: int,
    status: str = Body(..., embed=True),  # approved, shipped, completed
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    transaction = db.query(models.Transaction).filter(models.Transaction.id == id).first()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Authorize: admin or seller or buyer
    if current_user.role != "admin" and current_user.id != transaction.seller_id and current_user.id != transaction.buyer_id:
         raise HTTPException(status_code=403, detail="Unauthorized action")

    try:
        transaction.status = status
        
        if status == "completed":
            waste = db.query(models.Waste).filter(models.Waste.id == transaction.waste_id).first()
            if waste:
                waste.status = "exchanged"
            
            # Increment carbon credit score and revenue profiles
            seller_profile = db.query(models.Industry).filter(models.Industry.user_id == transaction.seller_id).first()
            if seller_profile:
                seller_profile.revenue += transaction.total_price
                seller_profile.carbon_saved += transaction.carbon_saved_kg

            buyer_profile = db.query(models.Industry).filter(models.Industry.user_id == transaction.buyer_id).first()
            if buyer_profile:
                buyer_profile.carbon_saved += transaction.carbon_saved_kg

        # Fetch waste name for notification details
        waste_obj = db.query(models.Waste).filter(models.Waste.id == transaction.waste_id).first()
        waste_name = waste_obj.name if waste_obj else "Material"

        # Notify participants
        seller_notif = models.Notification(
            recipient_id=transaction.seller_id,
            title="Transaction Updated",
            message=f"Transaction for '{waste_name}' is now {status}.",
            type="transaction",
            is_read=False
        )
        db.add(seller_notif)

        buyer_notif = models.Notification(
            recipient_id=transaction.buyer_id,
            title="Transaction Updated",
            message=f"Transaction for '{waste_name}' is now {status}.",
            type="transaction",
            is_read=False
        )
        db.add(buyer_notif)

        db.commit()
        db.refresh(transaction)
        
        return serialize_transaction(transaction, db)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
