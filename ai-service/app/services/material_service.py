import os
import json
import io
from typing import Dict, Any, List, Optional
from PIL import Image

try:
    import torch
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

from app.services.model_loader import model_registry

class MaterialClassifierService:
    def __init__(self):
        self.category_display_map = {
            "cardboard": "Cardboard",
            "glass": "Glass Cullet",
            "metal": "Metal Scrap",
            "paper": "Paper / Fibers",
            "plastic": "Plastic Scrap",
            "trash": "General Trash"
        }

    def classify_image(self, image_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        classifier_data = model_registry.load_material_classifier()
        
        if classifier_data is None or not HAS_TORCH:
            # Model missing or failed to load - Return clear model_unavailable status without fake predictions
            return {
                "status": "model_unavailable",
                "model_loaded": False,
                "prediction": "unknown",
                "predicted_class": "unknown",
                "category": "Unclassified",
                "confidence": 0.0,
                "top_predictions": [],
                "model_name": "EfficientNet-B0 Material Classifier",
                "message": "EfficientNet-B0 material classifier model weights not available."
            }

        try:
            model = classifier_data["model"]
            class_names = classifier_data["class_names"]
            transform = classifier_data["transform"]
            device = model_registry.get_device()

            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            input_tensor = transform(image).unsqueeze(0).to(device)

            with torch.no_grad():
                outputs = model(input_tensor)
                probabilities = torch.softmax(outputs, dim=1)[0]

            top_probs, top_indices = torch.topk(probabilities, len(class_names))
            
            top_predictions = []
            for prob, idx in zip(top_probs, top_indices):
                cls_name = class_names[idx.item()]
                top_predictions.append({
                    "class": cls_name,
                    "confidence": round(float(prob.item()), 4)
                })

            top_class = top_predictions[0]["class"]
            top_conf = top_predictions[0]["confidence"]
            display_category = self.category_display_map.get(top_class, top_class.title())

            return {
                "status": "trained",
                "model_loaded": True,
                "prediction": top_class,
                "predicted_class": top_class,
                "category": display_category,
                "confidence": top_conf,
                "top_predictions": top_predictions,
                "model": "EfficientNet-B0",
                "model_name": "EfficientNet-B0",
                "model_version": "1.0.0"
            }

        except Exception as e:
            return {
                "status": "error",
                "model_loaded": True,
                "prediction": "unknown",
                "confidence": 0.0,
                "error": str(e)
            }

material_service = MaterialClassifierService()
