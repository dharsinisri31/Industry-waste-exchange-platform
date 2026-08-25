from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.services.transformation_service import transformation_service

router = APIRouter()

class TransformationRequest(BaseModel):
    waste_id: Optional[int] = None
    name: Optional[str] = "Fly Ash / Polymer Scrap"
    category: Optional[str] = "Industrial Waste"
    composition: Optional[str] = "Standard Composition"
    quantity: Optional[float] = 50.0

@router.post("/analyze")
async def analyze_transformation(req: TransformationRequest, db: Session = Depends(get_db)):
    """
    Returns AI Waste Transformation advice including products, machinery, financial CapEx/OpEx, ROI, carbon savings, and 5-step implementation roadmap.
    """
    waste_name = req.name
    category = req.category
    composition = req.composition
    quantity = req.quantity

    # If waste_id is provided, pull exact details from database
    if req.waste_id:
        waste = db.query(models.Waste).filter(models.Waste.id == req.waste_id).first()
        if waste:
            waste_name = waste.name
            category = waste.category
            composition = waste.description or waste.name
            quantity = waste.quantity

    result = transformation_service.analyze_transformation(
        waste_name=waste_name,
        category=category,
        composition=composition,
        quantity_tons=quantity
    )
    return result
