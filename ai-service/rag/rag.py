from app.services.rag_service import rag_service

class RAGPipeline:
    def __init__(self):
        self.service = rag_service

    def query(self, message: str, history: list = None):
        return self.service.query(message, history or [])

rag_pipeline = RAGPipeline()
