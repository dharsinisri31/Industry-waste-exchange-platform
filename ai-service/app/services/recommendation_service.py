import numpy as np
import math

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False
    faiss = None

from app.services.embedding_service import embedding_service

class RecommendationService:
    def __init__(self):
        self.embedding_service = embedding_service

    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate geographical distance in km between two lat/lon points."""
        R = 6371.0  # Earth radius in kilometers
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def _calculate_quantity_score(self, offered_qty: float, requested_qty: float) -> float:
        """Calculate quantity compatibility ratio score (0.0 to 1.0)."""
        if requested_qty <= 0 or offered_qty <= 0:
            return 0.5
        ratio = min(offered_qty, requested_qty) / max(offered_qty, requested_qty)
        return round(float(ratio), 4)

    def _calculate_distance_score(self, distance_km: float, max_radius: float = 500.0) -> float:
        """Convert distance into a normalized proximity score (1.0 = close, 0.0 = >max_radius)."""
        if distance_km <= 0:
            return 1.0
        score = max(0.0, 1.0 - (distance_km / max_radius))
        return round(float(score), 4)

    def build_faiss_index(self, item_descriptions: list) -> tuple:
        """
        Generates SentenceTransformer embeddings for descriptions and builds a FAISS IndexFlatIP.
        Returns (index, normalized_embeddings_numpy_array).
        """
        if not item_descriptions:
            return None, np.array([])

        embeddings = []
        for desc in item_descriptions:
            vec = self.embedding_service.get_embedding(desc)
            embeddings.append(vec)

        emb_matrix = np.array(embeddings, dtype=np.float32)
        # Normalize for Inner Product (Cosine Similarity)
        norms = np.linalg.norm(emb_matrix, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        normalized_embeddings = emb_matrix / norms

        if HAS_FAISS:
            d = normalized_embeddings.shape[1]
            index = faiss.IndexFlatIP(d)
            index.add(normalized_embeddings)
            return index, normalized_embeddings
        else:
            return None, normalized_embeddings

    def match_waste_to_buyers(self, waste_item: dict, candidate_buyers: list, top_k: int = 5) -> list:
        """
        Matches a waste listing against candidate buyer industry requirements.
        """
        if not candidate_buyers:
            return []

        query_text = f"{waste_item.get('name', '')} {waste_item.get('category', '')} {waste_item.get('composition', '')}"
        query_vec = np.array([self.embedding_service.get_embedding(query_text)], dtype=np.float32)
        q_norm = np.linalg.norm(query_vec)
        if q_norm > 0:
            query_vec = query_vec / q_norm

        buyer_texts = [
          f"{b.get('companyName', '')} {b.get('neededWasteTypes', '')} {b.get('industryType', '')} {b.get('description', '')}"
          for b in candidate_buyers
        ]

        index, normalized_embeddings = self.build_faiss_index(buyer_texts)

        if index is not None and HAS_FAISS:
            scores, indices = index.search(query_vec, min(top_k, len(candidate_buyers)))
            sim_scores = scores[0]
        else:
            # Fallback NumPy Cosine Similarity Matrix
            sim_scores = np.dot(normalized_embeddings, query_vec.T).squeeze()
            if sim_scores.ndim == 0:
                sim_scores = np.array([sim_scores])

        results = []
        w_lat = float(waste_item.get('latitude', 12.9716))
        w_lon = float(waste_item.get('longitude', 77.5946))
        w_qty = float(waste_item.get('quantity', 100.0))

        for idx, buyer in enumerate(candidate_buyers):
            b_lat = float(buyer.get('latitude', 12.9800))
            b_lon = float(buyer.get('longitude', 77.6000))
            b_req_qty = float(buyer.get('requiredQuantity', 100.0))

            # 1. Cosine similarity score
            sem_score = max(0.0, float(sim_scores[idx]) if idx < len(sim_scores) else 0.5)

            # 2. Distance score
            dist_km = self._haversine_distance(w_lat, w_lon, b_lat, b_lon)
            dist_score = self._calculate_distance_score(dist_km)

            # 3. Quantity compatibility score
            qty_score = self._calculate_quantity_score(w_qty, b_req_qty)

            # Composite match formula: 50% semantic, 30% proximity, 20% quantity
            composite_score = round(0.50 * sem_score + 0.30 * dist_score + 0.20 * qty_score, 4)

            results.append({
                "buyer_id": buyer.get("_id", str(idx)),
                "company_name": buyer.get("companyName", "Industry Buyer"),
                "compatibility_score": composite_score,
                "semantic_similarity": round(sem_score, 4),
                "distance_km": round(dist_km, 2),
                "distance_score": dist_score,
                "quantity_score": qty_score,
                "details": {
                    "industry_type": buyer.get("industryType", "General"),
                    "needed_materials": buyer.get("neededWasteTypes", waste_item.get("category", "")),
                    "location": buyer.get("city", "Local Facility")
                }
            })

        results.sort(key=lambda x: x["compatibility_score"], reverse=True)
        return results[:top_k]

recommendation_service = RecommendationService()
