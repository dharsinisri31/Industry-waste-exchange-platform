from fastapi import APIRouter, HTTPException, Form
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from app.services.circular_economy_service import circular_economy_service
from app.services.price_improvement_service import price_improvement_service
from app.services.buyer_recommendation_service import buyer_recommendation_service

router = APIRouter()

class CircularRequest(BaseModel):
    wasteName: str = "PET Plastic Scrap"
    category: str = "Plastic"
    quantity: float = 1000.0
    purity: float = 90.0

class PriceImprovementRequest(BaseModel):
    material: str = "Mixed PET Plastic"
    currentPurity: float = 82.0
    currentPrice: float = 32.0
    contaminationPct: float = 8.0

@router.post("/pathways")
async def get_circular_pathways(req: CircularRequest):
    return circular_economy_service.recommend_pathways(req.wasteName, req.category, req.quantity, req.purity)

@router.post("/price-improvement")
async def get_price_improvements(req: PriceImprovementRequest):
    return price_improvement_service.generate_suggestions(req.material, req.currentPurity, req.currentPrice, req.contaminationPct)

@router.post("/buyer-matches")
async def get_buyer_matches(payload: Dict[str, Any]):
    waste_item = payload.get("wasteItem", {})
    candidates = payload.get("candidates", [])
    return buyer_recommendation_service.match_buyers(waste_item, candidates)
