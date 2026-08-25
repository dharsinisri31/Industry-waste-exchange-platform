from typing import Dict, Any

class GradingService:
    """
    Automatic Quality Grading Engine:
    Calculates Grade A, Grade B, Grade C, Grade D based on material, purity, contamination, damage, moisture, and foreign material scores.
    Also provides material-specific sub-grades (PET Grade, HDPE Grade, Aluminium Grade, Steel Grade, etc.).
    """

    def calculate_grade(self, material: str, purity: float, contamination: float, damage: float, moisture: float) -> Dict[str, Any]:
        purity_score = max(0, min(100, purity)) * 0.4
        contamination_penalty = min(100, contamination) * 0.3
        damage_penalty = min(100, damage * 5) * 0.2
        moisture_penalty = min(100, moisture * 2) * 0.1

        quality_score = purity_score + (30 - contamination_penalty) + (20 - damage_penalty) + (10 - moisture_penalty)
        quality_score = round(max(0, min(100, quality_score)), 1)

        if quality_score >= 85:
            grade = "Grade A"
            recyclability = 95.0
            yield_pct = 94.0
        elif quality_score >= 70:
            grade = "Grade B"
            recyclability = 85.0
            yield_pct = 86.0
        elif quality_score >= 50:
            grade = "Grade C"
            recyclability = 70.0
            yield_pct = 72.0
        else:
            grade = "Grade D"
            recyclability = 50.0
            yield_pct = 55.0

        # Material-specific grading
        mat_lower = material.lower()
        if "plastic" in mat_lower or "pet" in mat_lower or "hdpe" in mat_lower:
            spec_grade = f"{material} - Premium Virgin-Equivalent" if grade == "Grade A" else f"{material} - Recycled Industrial Grade"
        elif "metal" in mat_lower or "aluminium" in mat_lower or "steel" in mat_lower:
            spec_grade = f"{material} - High Purity Melt Grade" if grade == "Grade A" else f"{material} - Heavy Industrial Scrap"
        elif "paper" in mat_lower or "cardboard" in mat_lower:
            spec_grade = f"{material} - Long Fiber Kraft Grade" if grade == "Grade A" else f"{material} - Mixed OCC Grade"
        else:
            spec_grade = f"{material} - Standard Process Grade"

        return {
            "qualityScore": quality_score,
            "grade": grade,
            "materialSpecificGrade": spec_grade,
            "recyclabilityScore": recyclability,
            "recoveryYield": yield_pct,
            "scoreBreakdown": {
                "purityContribution": round(purity_score, 1),
                "contaminationDeduction": round(contamination_penalty, 1),
                "damageDeduction": round(damage_penalty, 1),
                "moistureDeduction": round(moisture_penalty, 1)
            }
        }

grading_service = GradingService()
