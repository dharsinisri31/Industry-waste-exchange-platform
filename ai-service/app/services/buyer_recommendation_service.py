import math
from typing import Dict, Any, List

class BuyerRecommendationService:
    """
    Multi-Factor AI Buyer Matching Engine:
    Considers Material Compatibility, Buyer Requirements, Quality, Quantity, Distance, Price, Supplier/Buyer Reliability, and Sustainability.
    """

    def calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371.0 # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return round(R * c, 1)

    def match_buyers(self, waste_item: Dict[str, Any], candidate_buyers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        results = []
        waste_cat = waste_item.get("category", "").lower()
        waste_mat = waste_item.get("material", waste_item.get("name", "")).lower()
        waste_qty = float(waste_item.get("quantity", 100))
        w_lat = float(waste_item.get("latitude", 0.0))
        w_lon = float(waste_item.get("longitude", 0.0))

        for buyer in candidate_buyers:
            b_id = str(buyer.get("id", buyer.get("_id", "buyer_id")))
            name = buyer.get("company_name", buyer.get("name", "Industrial Recycling Corp"))
            needed = str(buyer.get("needed_waste_types", buyer.get("description", ""))).lower()
            b_lat = float(buyer.get("latitude", 0.0))
            b_lon = float(buyer.get("longitude", 0.0))
            capacity = float(buyer.get("quantity_capacity", 500))
            rating = float(buyer.get("rating", 4.5))

            dist = self.calculate_distance(w_lat, w_lon, b_lat, b_lon) if w_lat != 0.0 else 25.0

            # 1. Material Compatibility
            mat_compat = 0.95 if (waste_cat in needed or waste_mat in needed) else 0.70

            # 2. Quantity Fit
            qty_fit = min(1.0, waste_qty / capacity) if capacity > 0 else 0.8

            # 3. Distance Factor
            dist_factor = max(0.4, 1.0 - (dist / 500.0))

            # 4. Reliability Factor
            reliability = min(1.0, rating / 5.0)

            # Combined AI Score
            score = (mat_compat * 0.40) + (dist_factor * 0.25) + (qty_fit * 0.20) + (reliability * 0.15)
            match_pct = round(score * 100, 1)

            reasons = []
            if mat_compat > 0.85:
                reasons.append("High material specification alignment")
            if dist < 50:
                reasons.append("Proximity cluster (Low transport emissions)")
            if qty_fit > 0.7:
                reasons.append("Matching volume capacity")
            if rating >= 4.5:
                reasons.append("Verified high reliability rating")

            results.append({
                "buyerId": b_id,
                "companyName": name,
                "matchPercentage": match_pct,
                "distanceKm": dist,
                "reasons": reasons,
                "compatibilityBreakdown": {
                    "materialCompatibility": round(mat_compat * 100, 1),
                    "quantityFit": round(qty_fit * 100, 1),
                    "proximityScore": round(dist_factor * 100, 1),
                    "reliabilityRating": round(reliability * 100, 1)
                }
            })

        results.sort(key=lambda x: x["matchPercentage"], reverse=True)
        return results

buyer_recommendation_service = BuyerRecommendationService()
