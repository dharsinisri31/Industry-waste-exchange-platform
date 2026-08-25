import os
import uuid
import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Form, UploadFile, File, status, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.utils.security import get_current_user
from app.routers.prediction import rf_model, categories_map, base_rates
from app.services.route_service import route_service
from app.services.carbon_service import calculate_carbon_saved

router = APIRouter()

def calculate_distance(coords1, coords2):
    # coords = [longitude, latitude]
    lon1, lat1 = coords1
    lon2, lat2 = coords2
    
    R = 6371.0  # Earth radius in km
    
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)
    
    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * \
        math.sin(delta_lambda / 2.0) ** 2
    c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
    
    return round(R * c, 2)

@router.post("")
async def create_listing(
    name: str = Form(...),
    category: str = Form(...),
    quantity: float = Form(...),
    unit: str = Form(...),
    address: str = Form(...),
    city: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    price: float = Form(...),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        image_url = ""
        if file:
            os.makedirs("uploads", exist_ok=True)
            filename = f"{uuid.uuid4()}_{file.filename}"
            filepath = os.path.join("uploads", filename)
            with open(filepath, "wb") as f:
                content = await file.read()
                f.write(content)
            image_url = f"/uploads/{filename}"

        # Call in-process Random Forest price prediction
        cat_idx = categories_map.get(category, categories_map.get("Other", 8))
        try:
            prediction = rf_model.predict([[cat_idx, quantity]])
            predicted_price = float(prediction[0])
        except Exception:
            rate = base_rates.get(cat_idx, 10.0)
            predicted_price = quantity * rate

        new_waste = models.Waste(
            uploader_id=current_user.id,
            name=name,
            category=category,
            quantity=quantity,
            unit=unit,
            address=address,
            city=city,
            latitude=latitude,
            longitude=longitude,
            image_url=image_url,
            description=description,
            price=price,
            predicted_price=predicted_price,
            status="available"
        )
        
        db.add(new_waste)
        db.commit()
        db.refresh(new_waste)

        # Output in MongoDB format
        return {
            "_id": str(new_waste.id),
            "uploader": str(new_waste.uploader_id),
            "name": new_waste.name,
            "category": new_waste.category,
            "quantity": new_waste.quantity,
            "unit": new_waste.unit,
            "address": new_waste.address,
            "city": new_waste.city,
            "location": new_waste.location,
            "imageUrl": new_waste.image_url,
            "description": new_waste.description,
            "price": new_waste.price,
            "predictedPrice": new_waste.predicted_price,
            "status": new_waste.status,
            "createdAt": new_waste.created_at.isoformat() if new_waste.created_at else None,
            "updatedAt": new_waste.updated_at.isoformat() if new_waste.updated_at else None
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/marketplace")
async def get_marketplace(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    lng: Optional[float] = Query(None),
    lat: Optional[float] = Query(None),
    maxDistance: Optional[float] = Query(None),
    page: int = Query(1),
    limit: int = Query(10),
    db: Session = Depends(get_db)
):
    try:
        listings_query = db.query(models.Waste).filter(models.Waste.status == "available")
        if category:
            listings_query = listings_query.filter(models.Waste.category == category)
        if search:
            listings_query = listings_query.filter(
                models.Waste.name.ilike(f"%{search}%") | models.Waste.description.ilike(f"%{search}%")
            )
        
        listings = listings_query.all()
        
        # Proximity geofiltering and sorting
        if lng is not None and lat is not None:
            user_coords = [lng, lat]
            for item in listings:
                item.distance = calculate_distance(user_coords, [item.longitude, item.latitude])
            
            if maxDistance is not None:
                listings = [item for item in listings if item.distance <= maxDistance]
            
            listings.sort(key=lambda x: x.distance)

        total = len(listings)
        skip = (page - 1) * limit
        paginated = listings[skip : skip + limit]

        result_listings = []
        for item in paginated:
            profile = db.query(models.Industry).filter(models.Industry.user_id == item.uploader_id).first()
            item_dict = {
                "_id": str(item.id),
                "uploader": {
                    "_id": str(item.uploader.id),
                    "email": item.uploader.email,
                    "role": item.uploader.role,
                    "isVerified": item.uploader.is_verified
                },
                "name": item.name,
                "category": item.category,
                "quantity": item.quantity,
                "unit": item.unit,
                "address": item.address,
                "city": item.city,
                "imageUrl": item.image_url,
                "description": item.description,
                "price": item.price,
                "predictedPrice": item.predicted_price,
                "status": item.status,
                "location": item.location,
                "companyProfile": {
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
                } if profile else None,
                "createdAt": item.created_at.isoformat() if item.created_at else None,
                "updatedAt": item.updated_at.isoformat() if item.updated_at else None
            }
            if hasattr(item, "distance"):
                item_dict["distance"] = item.distance
            result_listings.append(item_dict)

        return {
            "page": page,
            "pages": math.ceil(total / limit) if limit > 0 else 1,
            "total": total,
            "listings": result_listings
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/my/listings")
async def get_my_listings(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    try:
        listings = db.query(models.Waste).filter(models.Waste.uploader_id == current_user.id).all()
        result_listings = []
        for item in listings:
            result_listings.append({
                "_id": str(item.id),
                "uploader": str(item.uploader_id),
                "name": item.name,
                "category": item.category,
                "quantity": item.quantity,
                "unit": item.unit,
                "address": item.address,
                "city": item.city,
                "imageUrl": item.image_url,
                "description": item.description,
                "price": item.price,
                "predictedPrice": item.predicted_price,
                "status": item.status,
                "location": item.location,
                "createdAt": item.created_at.isoformat() if item.created_at else None,
                "updatedAt": item.updated_at.isoformat() if item.updated_at else None
            })
        return result_listings
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{id}")
async def get_listing(id: int, db: Session = Depends(get_db)):
    item = db.query(models.Waste).filter(models.Waste.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Waste listing not found")

    profile = db.query(models.Industry).filter(models.Industry.user_id == item.uploader_id).first()
    return {
        "_id": str(item.id),
        "uploader": {
            "_id": str(item.uploader.id),
            "email": item.uploader.email,
            "role": item.uploader.role,
            "isVerified": item.uploader.is_verified
        },
        "name": item.name,
        "category": item.category,
        "quantity": item.quantity,
        "unit": item.unit,
        "address": item.address,
        "city": item.city,
        "imageUrl": item.image_url,
        "description": item.description,
        "price": item.price,
        "predictedPrice": item.predicted_price,
        "status": item.status,
        "location": item.location,
        "companyProfile": {
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
        } if profile else None,
        "createdAt": item.created_at.isoformat() if item.created_at else None,
        "updatedAt": item.updated_at.isoformat() if item.updated_at else None
    }

@router.delete("/{id}")
async def delete_listing(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    item = db.query(models.Waste).filter(models.Waste.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Listing not found")

    if item.uploader_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Unauthorized action")

    try:
        db.delete(item)
        db.commit()
        return {"message": "Listing removed successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{id}/exchange")
async def request_exchange(id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    waste = db.query(models.Waste).filter(models.Waste.id == id).first()
    if not waste:
        raise HTTPException(status_code=404, detail="Listing not found")

    if waste.status != "available":
        raise HTTPException(status_code=400, detail="Waste listing is no longer available")

    if waste.uploader_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot exchange with your own listing")

    seller_profile = db.query(models.Industry).filter(models.Industry.user_id == waste.uploader_id).first()
    buyer_profile = db.query(models.Industry).filter(models.Industry.user_id == current_user.id).first()

    if not seller_profile or not buyer_profile:
        raise HTTPException(status_code=400, detail="Sender or recipient profiles are incomplete")

    try:
        # Distance calculation
        seller_coords = [seller_profile.longitude, seller_profile.latitude]
        buyer_coords = [buyer_profile.longitude, buyer_profile.latitude]
        distance_km = calculate_distance(seller_coords, buyer_coords)

        # Call in-process OR-Tools optimization
        routing_result = route_service.optimize_route([seller_coords, buyer_coords])
        transport_cost = routing_result.get("transportCost", round(distance_km * 1.5, 2))

        # Carbon offset calculation
        carbon_data = calculate_carbon_saved(waste.category, waste.quantity, distance_km)

        # Create Transaction
        new_transaction = models.Transaction(
            waste_id=waste.id,
            seller_id=waste.uploader_id,
            buyer_id=current_user.id,
            quantity=waste.quantity,
            total_price=waste.price,
            distance_km=distance_km,
            carbon_saved_kg=carbon_data["netSavings"],
            transport_cost=transport_cost,
            status="pending"
        )
        db.add(new_transaction)

        # Mark waste status as pending
        waste.status = "pending"

        # Create alert notification for the seller
        new_notification = models.Notification(
            recipient_id=waste.uploader_id,
            title="Exchange Requested",
            message=f"{buyer_profile.company_name} has requested to exchange your listing '{waste.name}'.",
            type="transaction",
            is_read=False
        )
        db.add(new_notification)

        db.commit()
        db.refresh(new_transaction)

        return {
            "_id": str(new_transaction.id),
            "waste": str(new_transaction.waste_id),
            "seller": str(new_transaction.seller_id),
            "buyer": str(new_transaction.buyer_id),
            "quantity": new_transaction.quantity,
            "totalPrice": new_transaction.total_price,
            "status": new_transaction.status,
            "distanceKm": new_transaction.distance_km,
            "carbonSavedKg": new_transaction.carbon_saved_kg,
            "transportCost": new_transaction.transport_cost,
            "createdAt": new_transaction.created_at.isoformat() if new_transaction.created_at else None,
            "updatedAt": new_transaction.updated_at.isoformat() if new_transaction.updated_at else None
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
