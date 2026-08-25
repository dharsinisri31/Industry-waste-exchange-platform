from typing import Dict, Any, List

class PriceImprovementService:
    """
    AI Price Improvement Suggestion Engine:
    Generates actionable value-add steps for sellers to increase waste material value based on quality metrics.
    """

    def generate_suggestions(self, material: str, current_purity: float, current_price: float, contamination_pct: float) -> Dict[str, Any]:
        suggestions = []
        potential_purity = min(98.0, current_purity + 12.0)
        multiplier = 1.0

        mat_lower = material.lower()
        if "plastic" in mat_lower or "pet" in mat_lower:
            suggestions.append({
                "action": "Remove plastic caps and adhesive paper labels",
                "impact": "+ 6.5% Purity boost",
                "difficulty": "Easy / Manual Sorting"
            })
            suggestions.append({
                "action": "Wash and remove surface oil / residue",
                "impact": "+ 5.0% Purity boost",
                "difficulty": "Moderate / Hot Water Wash"
            })
            suggestions.append({
                "action": "Color sorting into clear vs mixed batches",
                "impact": "+ 15% Market Value Increase",
                "difficulty": "Moderate"
            })
            multiplier = 1.28
        elif "metal" in mat_lower or "steel" in mat_lower or "aluminium" in mat_lower:
            suggestions.append({
                "action": "Separate non-ferrous metals from steel scrap",
                "impact": "+ 18% Value Boost",
                "difficulty": "Easy / Magnetic Separation"
            })
            suggestions.append({
                "action": "Bale or compact trimmings to increase bulk density",
                "impact": "Reduces transport cost by 22%",
                "difficulty": "Baling Machine Required"
            })
            multiplier = 1.25
        else:
            suggestions.append({
                "action": "Segregate foreign contaminants and organic moisture",
                "impact": "+ 8.0% Purity boost",
                "difficulty": "Manual Sorting"
            })
            suggestions.append({
                "action": "Store in dry covered facility to maintain low moisture",
                "impact": "Prevents degradation & grade loss",
                "difficulty": "Easy"
            })
            multiplier = 1.20

        potential_price = round(current_price * multiplier, 2)

        return {
            "currentMaterial": material,
            "currentPurity": current_purity,
            "currentPrice": current_price,
            "suggestions": suggestions,
            "predictedPurity": potential_purity,
            "potentialPrice": potential_price,
            "valueGainEstimate": round(potential_price - current_price, 2),
            "percentageGain": round((multiplier - 1.0) * 100, 1)
        }

price_improvement_service = PriceImprovementService()
