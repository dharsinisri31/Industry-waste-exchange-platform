from typing import Dict, Any, List

class MultimodalService:
    """
    Multimodal AI Fusion & Conflict Resolver:
    Combines Visual Analysis + Document OCR + User Description + Lab Verification.
    Triggers 'CONFLICT DETECTED' status if sources disagree.
    """

    def analyze_multimodal(
        self,
        image_ai_result: Dict[str, Any],
        document_ocr_result: Dict[str, Any] = None,
        user_input: Dict[str, Any] = None
    ) -> Dict[str, Any]:

        img_mat = (image_ai_result.get("material", {}).get("type", "Plastic")).lower()
        ocr_mat = (document_ocr_result.get("material", "") if document_ocr_result else "").lower()
        usr_mat = (user_input.get("category", "") if user_input else "").lower()

        conflicts = []
        has_conflict = False

        # Compare Material Types
        if ocr_mat and img_mat not in ocr_mat and ocr_mat not in img_mat:
            has_conflict = True
            conflicts.append(f"Material mismatch: Image AI identified '{image_ai_result.get('material', {}).get('type')}', but Lab Report states '{document_ocr_result.get('material')}'.")

        if usr_mat and img_mat not in usr_mat and usr_mat not in img_mat:
            has_conflict = True
            conflicts.append(f"Material mismatch: User selected '{user_input.get('category')}', but Visual AI detected '{image_ai_result.get('material', {}).get('type')}'.")

        purity = document_ocr_result.get("purityPercentage") if document_ocr_result else image_ai_result.get("purity", {}).get("estimatedPurity", 90.0)
        grade = image_ai_result.get("qualityGrade", {}).get("grade", "Grade B")

        return {
            "status": "CONFLICT DETECTED" if has_conflict else "ALIGNED",
            "conflictDetected": has_conflict,
            "conflicts": conflicts,
            "fusion": {
                "finalMaterial": document_ocr_result.get("material") if document_ocr_result else image_ai_result.get("material", {}).get("type", "Plastic"),
                "purityPercentage": purity,
                "qualityGrade": grade,
                "confidenceScore": 0.70 if has_conflict else 0.95,
                "verificationActionRequired": "Lab verification requested to resolve conflict" if has_conflict else "No action required"
            },
            "sources": {
                "imageAI": image_ai_result.get("material", {}).get("type"),
                "documentOCR": document_ocr_result.get("material") if document_ocr_result else "No document attached",
                "userInput": user_input.get("category") if user_input else "N/A"
            }
        }

multimodal_service = MultimodalService()
