import numpy as np

try:
    from sentence_transformers import SentenceTransformer
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False
    SentenceTransformer = None

class EmbeddingService:
    def __init__(self):
        self.model = None
        if HAS_SENTENCE_TRANSFORMERS:
            try:
                self.model = SentenceTransformer('all-MiniLM-L6-v2')
                print("[Embedding] Loaded SentenceTransformer model 'all-MiniLM-L6-v2'.")
            except Exception as e:
                print(f"[Embedding] Warning: SentenceTransformer model failed ({e}). Using deterministic fallbacks.")
        else:
            print("[Embedding] sentence_transformers library not installed. Using deterministic vector fallbacks.")

    def get_embedding(self, text: str) -> list:
        if self.model is not None:
            try:
                embedding = self.model.encode(text)
                return embedding.tolist()
            except Exception as err:
                print(f"[Embedding] Encode error: {err}. Using fallback arrays.")
                
        # Generate deterministic vector matching MiniLM 384 dimensions
        np.random.seed(hash(text) % (2**32 - 1))
        mock_vec = np.random.randn(384)
        mock_vec = mock_vec / np.linalg.norm(mock_vec)
        return mock_vec.tolist()

embedding_service = EmbeddingService()
