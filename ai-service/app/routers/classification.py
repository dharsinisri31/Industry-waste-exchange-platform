from fastapi import APIRouter, UploadFile, File
from app.services.material_service import material_service

router = APIRouter()

@router.post("/classify")
async def classify(file: UploadFile = File(...)):
    """
    POST /classification/classify
    Infers 6-class baseline material category using trained EfficientNet-B0 model.
    """
    try:
        contents = await file.read()
        result = material_service.classify_image(contents, file.filename)
        return result
    except Exception as e:
        return {
            "prediction": "trash",
            "predicted_class": "trash",
            "category": "General Trash",
            "confidence": 0.0,
            "top_predictions": [],
            "model": "EfficientNet-B0",
            "model_name": "EfficientNet-B0",
            "model_version": "1.0.0",
            "status": "error",
            "error": str(e)
        }
