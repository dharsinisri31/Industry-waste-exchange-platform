import os
import cv2
import numpy as np
from typing import Dict, Any, Tuple

class PreprocessingService:
    """
    Reusable Image Preprocessing & Security Validation Utility:
    Supports MIME validation, file size checks, image resize, contrast enhancement (CLAHE), noise reduction, and normalization.
    """

    ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'}
    MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

    def validate_file(self, file_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Validates file extension, size, and image dimensions for security."""
        ext = os.path.splitext(filename)[1].lower()
        if ext not in self.ALLOWED_EXTENSIONS:
            return {"valid": False, "reason": f"Disallowed file extension '{ext}'. Only images permitted."}

        if len(file_bytes) > self.MAX_FILE_SIZE_BYTES:
            return {"valid": False, "reason": "File size exceeds 10 MB upload security limit."}

        nparr = np.frombuffer(file_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return {"valid": False, "reason": "Corrupt or unreadable image file buffer."}

        h, w, _ = img.shape
        if h < 50 or w < 50:
            return {"valid": False, "reason": "Image dimensions too small (Minimum 50x50 pixels required)."}

        return {"valid": True, "dimensions": {"height": h, "width": w}, "sizeBytes": len(file_bytes)}

    def preprocess_for_inference(self, img_bgr: np.ndarray, target_size: Tuple[int, int] = (640, 640)) -> np.ndarray:
        """Standardizes image format for CV inference (CLAHE contrast, Denoising, Resizing)."""
        # 1. Contrast Enhancement via CLAHE
        lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        cl = clahe.apply(l)
        limg = cv2.merge((cl, a, b))
        enhanced = cv2.cvtColor(limg, cv2.COLOR_LAB2BGR)

        # 2. Gaussian Denoising
        denoised = cv2.GaussianBlur(enhanced, (3, 3), 0)

        # 3. Resize to Target Dimensions
        resized = cv2.resize(denoised, target_size, interpolation=cv2.INTER_AREA)
        return resized

preprocessing_service = PreprocessingService()
