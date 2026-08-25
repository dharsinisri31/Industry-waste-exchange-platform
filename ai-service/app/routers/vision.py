from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
from app.services.vision_pipeline_service import vision_pipeline_service
from app.services.grading_service import grading_service

router = APIRouter()

@router.post("/analyze")
async def analyze_vision(
    file: Optional[UploadFile] = File(None),
    filename: Optional[str] = Form("industrial_waste.jpg")
):
    """Full Multi-Step AI Computer Vision Inspection Endpoint"""
    try:
        image_bytes = None
        if file is not None:
            image_bytes = await file.read()
            fn = file.filename
        else:
            # Fallback dummy buffer for testing
            image_bytes = b"FFD8FF" * 100
            fn = filename or "industrial_waste.jpg"

        result = vision_pipeline_service.analyze_waste_image(image_bytes, fn)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/grade")
async def calculate_quality_grade(
    material: str = Form("Plastic"),
    purity: float = Form(90.0),
    contamination: float = Form(5.0),
    damage: float = Form(1.0),
    moisture: float = Form(2.0)
):
    """Calculates Automatic Quality Grading (Grade A, B, C, D) and sub-grading"""
    return grading_service.calculate_grade(material, purity, contamination, damage, moisture)
