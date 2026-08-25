from typing import Dict, Any

class NegotiationService:
    """
    AI Negotiation Assistant:
    Calculates suggested asking prices, minimum acceptable price, expected market ranges, and offer recommendations for buyers.
    """

    def generate_negotiation_advice(self, current_price: float, grade: str, role: str = "seller") -> Dict[str, Any]:
        if role == "seller":
            suggested_asking = round(current_price * 1.08, 2)
            min_acceptable = round(current_price * 0.92, 2)
            advice = "Highlight the high purity grade and low transport distance to justify premium asking price."
        else: # buyer
            suggested_asking = round(current_price * 0.88, 2)
            min_acceptable = round(current_price * 0.95, 2)
            advice = "Propose a bulk volume discount commitment to secure a lower per-kg rate."

        return {
            "role": role,
            "currentListingPrice": current_price,
            "suggestedTargetPrice": suggested_asking,
            "acceptablePriceBoundary": min_acceptable,
            "marketPriceRange": {
                "low": round(current_price * 0.85, 2),
                "fair": current_price,
                "high": round(current_price * 1.15, 2)
            },
            "negotiationStrategyAdvice": advice
        }

negotiation_service = NegotiationService()
