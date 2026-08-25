from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.utils.security import get_current_user
from app.services.recommendation_service import recommendation_service

router = APIRouter()

class IndustryItem(BaseModel):
    id: str
    description: str

class MatchRequest(BaseModel):
    wasteText: str
    industries: List[IndustryItem]

class BuyerRecommendRequest(BaseModel):
    waste_id: Optional[int] = None
    name: Optional[str] = "Fly Ash / Scrap Material"
    category: Optional[str] = "Industrial Byproduct"
    composition: Optional[str] = "Silica, Alumina, Iron Oxide, Carbon"
    quantity: Optional[float] = 100.0
    unit: Optional[str] = "tons"
    latitude: Optional[float] = 12.9716
    longitude: Optional[float] = 77.5946

class SellerRecommendRequest(BaseModel):
    buyer_industry_type: Optional[str] = "Cement Manufacturing"
    required_waste_category: Optional[str] = "Fly Ash"
    required_composition: Optional[str] = "High Silica Content"
    required_quantity: Optional[float] = 500.0
    latitude: Optional[float] = 12.9716
    longitude: Optional[float] = 77.5946

@router.post("/match")
async def match_industries(req: MatchRequest):
    industries_list = [{"id": ind.id, "description": ind.description} for ind in req.industries]
    matches = recommendation_service.get_matches(req.wasteText, industries_list)
    return {"matches": matches}

@router.post("/recommend-buyers")
async def recommend_buyers(req: BuyerRecommendRequest, db: Session = Depends(get_db)):
    """
    Recommend top buyers/buyers industries for a seller's waste using FAISS & Sentence Transformers.
    """
    # Fetch industry buyers from DB
    industries = db.query(models.Industry).all()
    
    buyer_candidates = []
    if industries:
        for ind in industries:
            # Count past transactions
            tx_count = db.query(models.Transaction).filter(
                (models.Transaction.buyer_id == ind.user_id) & (models.Transaction.status == 'completed')
            ).count()
            
            buyer_candidates.append({
                "id": str(ind.user_id),
                "user_id": ind.user_id,
                "company_name": ind.company_name,
                "industry_type": ind.industry_type,
                "city": ind.city,
                "contact_phone": ind.contact_phone,
                "latitude": ind.latitude,
                "longitude": ind.longitude,
                "description": ind.description or f"Manufacturer in {ind.industry_type} sector seeking circular feedstocks.",
                "needed_waste_types": f"{req.category} {req.name} {req.composition}",
                "quantity_capacity": req.quantity * 1.5,
                "completed_transactions": tx_count,
                "rating": 4.8
            })
    else:
        # Default mock candidate list if DB is fresh
        buyer_candidates = [
            {
                "id": "101",
                "company_name": "EcoCement Infrastructure Ltd",
                "industry_type": "Cement & Concrete Manufacturing",
                "city": "Bangalore",
                "contact_phone": "+91 98765 43210",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "description": "Utilizes fly ash, blast furnace slag, and silica sludge for high-strength pozzolanic cement blends.",
                "needed_waste_types": "Fly Ash, Blast Furnace Slag, Silica Powder",
                "quantity_capacity": 500.0,
                "completed_transactions": 14,
                "rating": 4.9
            },
            {
                "id": "102",
                "company_name": "GreenTech Polymer Recyclers",
                "industry_type": "Plastic Recycling & Compounding",
                "city": "Chennai",
                "contact_phone": "+91 98765 12345",
                "latitude": 13.0827,
                "longitude": 80.2707,
                "description": "Processes HDPE, PET scrap, and industrial polymer offcuts into rPET granules and composite timber.",
                "needed_waste_types": "Plastic Scrap, HDPE, PET Flakes",
                "quantity_capacity": 250.0,
                "completed_transactions": 8,
                "rating": 4.6
            },
            {
                "id": "103",
                "company_name": "Apex Chemical Synthetics",
                "industry_type": "Chemical Distillation & Recovery",
                "city": "Hyderabad",
                "contact_phone": "+91 98765 67890",
                "latitude": 17.3850,
                "longitude": 78.4867,
                "description": "Specializes in spent solvent distillation, toluene recovery, and organic byproduct synthesis.",
                "needed_waste_types": "Spent Solvents, Chemical Sludge, Organic Effluents",
                "quantity_capacity": 150.0,
                "completed_transactions": 19,
                "rating": 4.8
            }
        ]

    waste_data = {
        "name": req.name,
        "category": req.category,
        "composition": req.composition,
        "quantity": req.quantity,
        "latitude": req.latitude,
        "longitude": req.longitude
    }

    recommendations = recommendation_service.match_buyers_for_waste(waste_data, buyer_candidates)
    return {"waste_name": req.name, "recommendations": recommendations}

@router.post("/recommend-sellers")
async def recommend_sellers(req: SellerRecommendRequest, db: Session = Depends(get_db)):
    """
    Recommend top seller waste listings for a buyer's feedstock requirement.
    """
    wastes = db.query(models.Waste).filter(models.Waste.status == "available").all()
    
    if not wastes:
        return {"recommendations": []}

    buyers_format = [{
        "id": "buyer_req",
        "company_name": req.buyer_industry_type,
        "industry_type": req.buyer_industry_type,
        "city": "Requirement",
        "needed_waste_types": f"{req.required_waste_category} {req.required_composition}",
        "description": f"Seeking {req.required_waste_category} with {req.required_composition}",
        "quantity_capacity": req.required_quantity,
        "latitude": req.latitude,
        "longitude": req.longitude,
        "completed_transactions": 5,
        "rating": 4.8
    }]

    sellers_results = []
    for w in wastes:
        waste_data = {
            "name": w.name,
            "category": w.category,
            "composition": w.description or "",
            "quantity": w.quantity,
            "latitude": w.latitude,
            "longitude": w.longitude
        }
        res = recommendation_service.match_buyers_for_waste(waste_data, buyers_format)
        if res:
            score_data = res[0]
            uploader = db.query(models.User).filter(models.User.id == w.uploader_id).first()
            ind = db.query(models.Industry).filter(models.Industry.user_id == w.uploader_id).first()
            
            sellers_results.append({
                "waste": {
                    "_id": str(w.id),
                    "name": w.name,
                    "category": w.category,
                    "quantity": w.quantity,
                    "unit": w.unit,
                    "price": w.price,
                    "city": w.city,
                    "description": w.description,
                    "image_url": w.image_url,
                    "seller_company": ind.company_name if ind else "Industrial Seller",
                    "seller_phone": ind.contact_phone if ind else "",
                    "seller_email": uploader.email if uploader else ""
                },
                "score": score_data["score"],
                "match_breakdown": score_data["match_breakdown"]
            })

    sellers_results.sort(key=lambda x: x["score"], reverse=True)
    return {"recommendations": sellers_results}

@router.get("/waste/{id}")
async def get_recommendations_for_waste(
    id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    waste = db.query(models.Waste).filter(models.Waste.id == id).first()
    if not waste:
        raise HTTPException(status_code=404, detail="Waste listing not found")

    industries = db.query(models.Industry).filter(models.Industry.user_id != waste.uploader_id).all()
    if not industries:
        return []

    waste_data = {
        "name": waste.name,
        "category": waste.category,
        "composition": waste.description or waste.name,
        "quantity": waste.quantity,
        "latitude": waste.latitude,
        "longitude": waste.longitude
    }

    buyer_candidates = []
    for ind in industries:
        user_obj = db.query(models.User).filter(models.User.id == ind.user_id).first()
        tx_count = db.query(models.Transaction).filter(
            (models.Transaction.buyer_id == ind.user_id) & (models.Transaction.status == 'completed')
        ).count()
        
        buyer_candidates.append({
            "id": str(ind.user_id),
            "user_id": ind.user_id,
            "company_name": ind.company_name,
            "industry_type": ind.industry_type,
            "city": ind.city,
            "address": ind.address,
            "contact_phone": ind.contact_phone,
            "email": user_obj.email if user_obj else "",
            "latitude": ind.latitude,
            "longitude": ind.longitude,
            "description": ind.description or f"{ind.company_name} operating in {ind.industry_type}.",
            "needed_waste_types": f"{waste.category} {waste.name}",
            "quantity_capacity": waste.quantity * 1.2,
            "completed_transactions": tx_count,
            "rating": 4.8,
            "location": ind.location
        })

    matches = recommendation_service.match_buyers_for_waste(waste_data, buyer_candidates)

    recommendations = []
    for match in matches:
        match_user_id = int(match["buyer_id"])
        cand = next((c for c in buyer_candidates if c["user_id"] == match_user_id), None)
        if cand:
            recommendations.append({
                "score": match["score"],
                "match_breakdown": match["match_breakdown"],
                "industry": {
                    "_id": str(cand["user_id"]),
                    "user": {
                        "_id": str(cand["user_id"]),
                        "email": cand["email"]
                    },
                    "companyName": cand["company_name"],
                    "address": cand["address"],
                    "city": cand["city"],
                    "contactPhone": cand["contact_phone"],
                    "industryType": cand["industry_type"],
                    "description": cand["description"],
                    "location": cand["location"]
                }
            })

    recommendations.sort(key=lambda x: x["score"], reverse=True)
    return recommendations
