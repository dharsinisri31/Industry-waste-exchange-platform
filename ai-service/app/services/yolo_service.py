import os
import tempfile
from typing import Dict, Any, List, Optional
from PIL import Image

from app.services.model_loader import model_registry

class YOLOService:
    def detect_objects(self, image_bytes: bytes, filename: str = "", conf_threshold: float = 0.25) -> Dict[str, Any]:
        yolo_det = model_registry.load_yolo_detection()
        
        if yolo_det is None:
            return {
                "status": "model_unavailable",
                "model_loaded": False,
                "detected_objects": [],
                "num_detections": 0,
                "message": "YOLO waste detection model weights not available."
            }

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                temp_file.write(image_bytes)
                temp_file_path = temp_file.name

            try:
                results = yolo_det(temp_file_path, conf=conf_threshold)
                result = results[0]

                detected_objects = []
                if result.boxes is not None:
                    names = result.names
                    for box in result.boxes:
                        cls_id = int(box.cls[0].item())
                        cls_name = names.get(cls_id, str(cls_id))
                        conf = float(box.conf[0].item())
                        xyxy = [float(val) for val in box.xyxy[0].tolist()]

                        detected_objects.append({
                            "class": cls_name,
                            "confidence": round(conf, 4),
                            "bbox": [round(val, 2) for val in xyxy]
                        })

                return {
                    "status": "success",
                    "model_loaded": True,
                    "detected_objects": detected_objects,
                    "num_detections": len(detected_objects),
                    "model_name": "YOLOv8 Waste Detector"
                }

            finally:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)

        except Exception as e:
            return {
                "status": "error",
                "model_loaded": True,
                "detected_objects": [],
                "num_detections": 0,
                "error": str(e)
            }

    def segment_objects(self, image_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        yolo_seg = model_registry.load_yolo_segmentation()
        
        if yolo_seg is None:
            # Model missing - return clear model_unavailable status without fake predictions
            return {
                "status": "model_unavailable",
                "model_loaded": False,
                "segmentations": [],
                "num_segments": 0,
                "message": "YOLO material segmentation model not trained yet. Model weights file not available."
            }

        try:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.jpg') as temp_file:
                temp_file.write(image_bytes)
                temp_file_path = temp_file.name

            try:
                results = yolo_seg(temp_file_path)
                result = results[0]
                
                segmentations = []
                if result.masks is not None:
                    names = result.names
                    for mask, box in zip(result.masks, result.boxes):
                        cls_id = int(box.cls[0].item())
                        cls_name = names.get(cls_id, str(cls_id))
                        conf = float(box.conf[0].item())
                        poly = mask.xy[0].tolist() if hasattr(mask, 'xy') else []

                        segmentations.append({
                            "class": cls_name,
                            "confidence": round(conf, 4),
                            "polygon": poly
                        })

                return {
                    "status": "success",
                    "model_loaded": True,
                    "segmentations": segmentations,
                    "num_segments": len(segmentations),
                    "model_name": "YOLOv8 Material Segmentor"
                }

            finally:
                if os.path.exists(temp_file_path):
                    os.remove(temp_file_path)

        except Exception as e:
            return {
                "status": "error",
                "model_loaded": True,
                "segmentations": [],
                "num_segments": 0,
                "error": str(e)
            }

yolo_service = YOLOService()
