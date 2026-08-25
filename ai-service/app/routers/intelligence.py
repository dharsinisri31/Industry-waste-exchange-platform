from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
from app.services.demand_forecasting_service import demand_forecasting_service
from app.services.ocr_service import ocr_service
from app.services.similarity_service import similarity_service
from app.services.fraud_detection_service import fraud_detection_service
from app.services.explainability_service import explainability_service
from app.services.negotiation_service import negotiation_service

router = APIRouter()

class DemandRequest(BaseModel):
    category: str = "Plastic"

class SimilarityRequest(BaseModel):
    description: str = "Clear PET bottle scrap with caps"
    category: str = "Plastic"

class ExplainGradeRequest(BaseModel):
    grade: str = "Grade B"
    purity: float = 90.0
    contamination: float = 5.0
    damage: float = 1.0

class ExplainPriceRequest(BaseModel):
    price: float = 35.0
    material: str = "PET Plastic"
    grade: str = "Grade B"

class NegotiationRequest(BaseModel):
    currentPrice: float = 35.0
    grade: str = "Grade B"
    role: str = "seller"

from app.services.multimodal_service import multimodal_service

class MultimodalPayload(BaseModel):
    imageAiResult: Dict[str, Any]
    documentOcrResult: Optional[Dict[str, Any]] = None
    userInput: Optional[Dict[str, Any]] = None

@router.post("/demand-forecast")
async def get_demand_forecast(req: DemandRequest):
    return demand_forecasting_service.forecast_demand(req.category)

@router.post("/ocr-document")
async def process_ocr(file: Optional[UploadFile] = File(None), filename: Optional[str] = Form("lab_report.pdf")):
    contents = await file.read() if file else b""
    fn = file.filename if file else (filename or "lab_report.pdf")
    return ocr_service.process_document(contents, fn)

@router.post("/similarity-search")
async def search_similar(req: SimilarityRequest):
    return similarity_service.find_similar_waste(req.description, req.category)

@router.post("/fraud-check")
async def check_fraud(price: float = Form(35.0), category: str = Form("Plastic")):
    return fraud_detection_service.analyze_risk(b"", price, category)

@router.post("/explain/grade")
async def explain_grade(req: ExplainGradeRequest):
    return explainability_service.explain_grade(req.grade, req.purity, req.contamination, req.damage)

@router.post("/explain/price")
async def explain_price(req: ExplainPriceRequest):
    return explainability_service.explain_price(req.price, req.material, req.grade)

@router.post("/negotiate")
async def negotiate(req: NegotiationRequest):
    return negotiation_service.generate_negotiation_advice(req.currentPrice, req.grade, req.role)

@router.post("/multimodal")
async def analyze_multimodal(req: MultimodalPayload):
    return multimodal_service.analyze_multimodal(req.imageAiResult, req.documentOcrResult, req.userInput)

@router.get("/status")
async def get_ai_models_status():
    return {
        "service": "FastAPI AI Engine",
        "version": "3.0.0",
        "models": {
            "objectDetection": {"status": "MODEL TRAINED", "architecture": "YOLOv8n"},
            "materialClassifier": {"status": "MODEL TRAINED", "architecture": "EfficientNet-B0"},
            "pricingRegressor": {"status": "MODEL TRAINED", "architecture": "RandomForestRegressor"},
            "demandForecaster": {"status": "SYNTHETIC DATA", "architecture": "LSTM Time-Series"},
            "segmentation": {"status": "RULE-BASED FALLBACK", "architecture": "YOLOv8-Seg Ready"},
            "documentOCR": {"status": "MODEL TRAINED", "architecture": "Document Intelligence Engine"}
        }
    }
