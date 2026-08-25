import os
import json
import logging
import threading
from typing import Dict, Any, Optional

try:
    import torch
    # Handle PyTorch 2.6 weights_only parameter requirement safely
    _orig_torch_load = torch.load
    def _safe_torch_load(*args, **kwargs):
        if 'weights_only' not in kwargs:
            kwargs['weights_only'] = False
        return _orig_torch_load(*args, **kwargs)
    torch.load = _safe_torch_load
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False

try:
    import torchvision.transforms as transforms
    from torchvision import models as tv_models
    import torch.nn as nn
    HAS_TORCHVISION = True
except ImportError:
    HAS_TORCHVISION = False

try:
    import joblib
    HAS_JOBLIB = True
except ImportError:
    HAS_JOBLIB = False

try:
    from ultralytics import YOLO
    HAS_ULTRALYTICS = True
except ImportError:
    HAS_ULTRALYTICS = False

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ModelRegistry")

class ModelRegistry:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(ModelRegistry, cls).__new__(cls)
                cls._instance._init_registry()
            return cls._instance

    def _init_registry(self):
        self.device = "cuda" if (HAS_TORCH and torch.cuda.is_available()) else "cpu"
        logger.info(f"[ModelRegistry] Initialized on device: {self.device}")
        
        self.models: Dict[str, Any] = {}
        self.statuses: Dict[str, Dict[str, Any]] = {}
        self.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        self.root_dir = os.path.abspath(os.path.join(self.base_dir, ".."))

    def get_device(self) -> str:
        return self.device

    # --- 1. EfficientNet Material Classifier ---
    def load_material_classifier(self) -> Optional[Any]:
        model_name = "material_classifier"
        if model_name in self.models:
            return self.models[model_name]

        model_path = os.path.join(self.base_dir, "models", "classification", "material_classifier_efficientnet_b0.pth")
        class_names_path = os.path.join(self.base_dir, "models", "classification", "class_names.json")

        if not os.path.exists(model_path):
            logger.warning(f"[ModelRegistry] Material classifier weights file missing at: {model_path}")
            self.statuses[model_name] = {"loaded": False, "file": model_path, "error": "File missing"}
            return None

        if not (HAS_TORCH and HAS_TORCHVISION):
            self.statuses[model_name] = {"loaded": False, "file": model_path, "error": "PyTorch/Torchvision missing"}
            return None

        try:
            if os.path.exists(class_names_path):
                with open(class_names_path, "r", encoding="utf-8") as f:
                    class_names = json.load(f)
            else:
                class_names = ['cardboard', 'glass', 'metal', 'paper', 'plastic', 'trash']

            num_classes = len(class_names)
            
            model = tv_models.efficientnet_b0(weights=None)
            in_features = model.classifier[1].in_features
            model.classifier = nn.Sequential(
                nn.Dropout(p=0.2, inplace=True),
                nn.Linear(in_features, num_classes)
            )

            state_dict = torch.load(model_path, map_location=self.device)
            if isinstance(state_dict, dict) and "model_state_dict" in state_dict:
                state_dict = state_dict["model_state_dict"]
            model.load_state_dict(state_dict)
            model.to(self.device)
            model.eval()

            self.models[model_name] = {
                "model": model,
                "class_names": class_names,
                "transform": transforms.Compose([
                    transforms.Resize((224, 224)),
                    transforms.ToTensor(),
                    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
                ])
            }
            self.statuses[model_name] = {"loaded": True, "file": model_path, "num_classes": num_classes, "error": None}
            logger.info(f"[ModelRegistry] EfficientNet-B0 Material Classifier loaded from {model_path}.")
            return self.models[model_name]

        except Exception as e:
            logger.error(f"[ModelRegistry] Error loading Material Classifier: {e}")
            self.statuses[model_name] = {"loaded": False, "file": model_path, "error": str(e)}
            return None

    # --- 2. YOLO Waste Detector ---
    def load_yolo_detection(self) -> Optional[Any]:
        model_name = "yolo_detection"
        if model_name in self.models:
            return self.models[model_name]

        model_path = os.path.join(self.base_dir, "models", "detection", "best_waste_detector.pt")
        if not os.path.exists(model_path):
            model_path = os.path.join(self.base_dir, "models", "detection", "best.pt")

        if not os.path.exists(model_path):
            logger.warning(f"[ModelRegistry] YOLO detection weights file missing at: {model_path}")
            self.statuses[model_name] = {"loaded": False, "file": model_path, "error": "File missing"}
            return None

        if not HAS_ULTRALYTICS:
            self.statuses[model_name] = {"loaded": False, "file": model_path, "error": "Ultralytics package missing"}
            return None

        try:
            model = YOLO(model_path)
            self.models[model_name] = model
            self.statuses[model_name] = {"loaded": True, "file": model_path, "error": None}
            logger.info(f"[ModelRegistry] YOLO Waste Detector loaded from {model_path}.")
            return model
        except Exception as e:
            logger.error(f"[ModelRegistry] Error loading YOLO Waste Detector: {e}")
            self.statuses[model_name] = {"loaded": False, "file": model_path, "error": str(e)}
            return None

    # --- 3. YOLO Material Segmentor ---
    def load_yolo_segmentation(self) -> Optional[Any]:
        model_name = "yolo_segmentation"
        if model_name in self.models:
            return self.models[model_name]

        model_path = os.path.join(self.base_dir, "models", "segmentation", "best_segmentation.pt")
        if not os.path.exists(model_path):
            logger.info(f"[ModelRegistry] YOLO segmentation model weights file missing: {model_path} (Model Not Trained Yet)")
            self.statuses[model_name] = {
                "loaded": False,
                "file": model_path,
                "status": "model_unavailable",
                "error": "Model weights file not found. Segmentation model not yet trained."
            }
            return None

        if not HAS_ULTRALYTICS:
            self.statuses[model_name] = {"loaded": False, "file": model_path, "error": "Ultralytics package missing"}
            return None

        try:
            model = YOLO(model_path)
            self.models[model_name] = model
            self.statuses[model_name] = {"loaded": True, "file": model_path, "error": None}
            logger.info(f"[ModelRegistry] YOLO Segmentation model loaded from {model_path}.")
            return model
        except Exception as e:
            self.statuses[model_name] = {"loaded": False, "file": model_path, "error": str(e)}
            return None

    # --- 4. Price Regressor Model ---
    def load_price_model(self) -> Optional[Any]:
        model_name = "price_model"
        if model_name in self.models:
            return self.models[model_name]

        possible_paths = [
            os.path.join(self.root_dir, "models", "pricing", "price_rf_model.joblib"),
            os.path.join(self.base_dir, "models", "saved-models", "price_model.pkl"),
            os.path.join(self.base_dir, "models", "saved-models", "price_rf_model.joblib")
        ]

        model_path = None
        for p in possible_paths:
            if os.path.exists(p):
                model_path = p
                break

        if not model_path:
            logger.warning(f"[ModelRegistry] Price model file missing.")
            self.statuses[model_name] = {"loaded": False, "file": possible_paths[0], "error": "File missing"}
            return None

        if not HAS_JOBLIB:
            self.statuses[model_name] = {"loaded": False, "file": model_path, "error": "Joblib missing"}
            return None

        try:
            model = joblib.load(model_path)
            self.models[model_name] = model
            self.statuses[model_name] = {"loaded": True, "file": model_path, "error": None}
            logger.info(f"[ModelRegistry] Price Regressor model loaded from {model_path}.")
            return model
        except Exception as e:
            logger.error(f"[ModelRegistry] Error loading Price Regressor: {e}")
            self.statuses[model_name] = {"loaded": False, "file": model_path, "error": str(e)}
            return None

    # --- 5. SentenceTransformer Embeddings ---
    def load_embedding_model(self) -> Optional[Any]:
        model_name = "embedding_model"
        if model_name in self.models:
            return self.models[model_name]

        if not HAS_SENTENCE_TRANSFORMERS:
            self.statuses[model_name] = {"loaded": False, "error": "SentenceTransformers package missing"}
            return None

        try:
            model = SentenceTransformer('all-MiniLM-L6-v2')
            self.models[model_name] = model
            self.statuses[model_name] = {"loaded": True, "name": "all-MiniLM-L6-v2", "error": None}
            logger.info("[ModelRegistry] SentenceTransformer 'all-MiniLM-L6-v2' loaded.")
            return model
        except Exception as e:
            logger.error(f"[ModelRegistry] Error loading SentenceTransformer: {e}")
            self.statuses[model_name] = {"loaded": False, "error": str(e)}
            return None

    # --- 6. FAISS RAG Index ---
    def load_rag_index(self) -> Optional[Any]:
        model_name = "rag_index"
        if model_name in self.models:
            return self.models[model_name]

        faiss_path = os.path.join(self.base_dir, "models", "faiss", "index.faiss")

        if not HAS_FAISS:
            self.statuses[model_name] = {"loaded": False, "error": "FAISS package missing"}
            return None

        try:
            from app.services.rag_service import rag_service
            if rag_service.vector_store is not None:
                self.models[model_name] = {"vector_store": rag_service.vector_store}
                self.statuses[model_name] = {"loaded": True, "type": "FAISS LangChain VectorStore", "error": None}
                logger.info("[ModelRegistry] RAG FAISS vector store active in memory.")
                return self.models[model_name]
            elif os.path.exists(faiss_path):
                index = faiss.read_index(faiss_path)
                self.models[model_name] = {"index": index, "file": faiss_path}
                self.statuses[model_name] = {"loaded": True, "file": faiss_path, "error": None}
                logger.info(f"[ModelRegistry] RAG FAISS index loaded from {faiss_path}.")
                return self.models[model_name]
            else:
                self.statuses[model_name] = {"loaded": False, "file": faiss_path, "error": "FAISS vector store unavailable"}
                return None
        except Exception as e:
            logger.error(f"[ModelRegistry] Error loading FAISS RAG index: {e}")
            self.statuses[model_name] = {"loaded": False, "file": faiss_path, "error": str(e)}
            return None

    def get_all_statuses(self) -> Dict[str, Dict[str, Any]]:
        self.load_material_classifier()
        self.load_yolo_detection()
        self.load_yolo_segmentation()
        self.load_price_model()
        self.load_embedding_model()
        self.load_rag_index()
        return self.statuses

# Global singleton accessor
model_registry = ModelRegistry()
