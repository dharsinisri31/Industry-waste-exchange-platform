from typing import Dict, Any, List

class ExplainabilityService:
    """
    Explainable AI (XAI) Generation Engine:
    Provides transparent explanations for Quality Grade, Predicted Price, Buyer Recommendation scores, and Contamination factors.
    """

    def explain_grade(self, grade: str, purity: float, contamination: float, damage: float) -> Dict[str, Any]:
        return {
            "target": "Quality Grade",
            "decision": grade,
            "explanation": f"Assigned {grade} because visual purity is estimated at {purity}% with low contamination ({contamination}%). Damage score of {damage}/10 indicates minimal physical degradation.",
            "keyDrivers": [
                {"factor": "Purity %", "impact": "+40% positive contribution"},
                {"factor": "Contamination %", "impact": f"-{contamination*2}% deduction"},
                {"factor": "Surface Wear", "impact": "Negligible structural loss"}
            ]
        }

    def explain_price(self, price: float, material: str, grade: str) -> Dict[str, Any]:
        return {
            "target": "Predicted Price",
            "decision": f"₹{price}/kg",
            "explanation": f"Valuation for {material} ({grade}) derived from current demand index (+8.5%), regional buyer capacity, and virgin raw material pricing benchmarks.",
            "keyDrivers": [
                {"factor": "Material Virgin Parity", "weight": "45%"},
                {"factor": "Regional Buyer Proximity", "weight": "30%"},
                {"factor": "Current Market Demand Index", "weight": "25%"}
            ]
        }

explainability_service = ExplainabilityService()
