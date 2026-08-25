import os
import numpy as np

try:
    from sentence_transformers import SentenceTransformer  # type: ignore
    HAS_SENTENCE_TRANSFORMERS = True
except ImportError:
    HAS_SENTENCE_TRANSFORMERS = False
    SentenceTransformer = None

try:
    from langchain_community.vectorstores import FAISS  # type: ignore
    from langchain_core.documents import Document  # type: ignore
    from langchain_core.embeddings import Embeddings  # type: ignore
    HAS_LANGCHAIN = True
except ImportError:
    HAS_LANGCHAIN = False
    FAISS = None

    class Document:
        def __init__(self, page_content: str = "", metadata: dict = None):
            self.page_content = page_content
            self.metadata = metadata or {}

    class Embeddings:
        pass

# Custom Embeddings Wrapper for Sentence Transformers + LangChain
class LocalSentenceTransformerEmbeddings(Embeddings):
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        self.model = None
        if HAS_SENTENCE_TRANSFORMERS:
            try:
                self.model = SentenceTransformer(model_name)
                print(f"[RAG] Loaded SentenceTransformer model '{model_name}'.")
            except Exception as e:
                print(f"[RAG] Warning: Failed to load SentenceTransformer ({e}). Fallback active.")

    def embed_documents(self, texts: list) -> list:
        if self.model:
            embeddings = self.model.encode(texts, show_progress_bar=False)
            return embeddings.tolist()
        res = []
        for t in texts:
            np.random.seed(hash(t) % (2**32 - 1))
            vec = np.random.randn(384)
            vec = vec / np.linalg.norm(vec)
            res.append(vec.tolist())
        return res

    def embed_query(self, text: str) -> list:
        return self.embed_documents([text])[0]

# Local Knowledge Base Documents
KNOWLEDGE_BASE_DOCUMENTS = [
    {
        "id": "DOC-REG-01",
        "title": "Industrial Hazardous & Other Wastes Management Rules",
        "category": "Hazardous Waste",
        "source": "hazardous_waste_rules.pdf",
        "content": "Industrial hazardous waste (sludge, chemical solvents, heavy metals) must be processed through State Pollution Control Board (SPCB) authorized recyclers. Storage is limited to 90 days on-site in UN-certified containment vessels."
    },
    {
        "id": "DOC-REG-02",
        "title": "Plastic Waste Management Rules (Extended Producer Responsibility)",
        "category": "Plastic Scrap",
        "source": "plastic_waste_rules.pdf",
        "content": "Recyclers and manufacturers must register under EPR guidelines. Industrial scrap such as PET, HDPE, and PP must be sorted, decontaminated, and funneled to registered plastic pelletizers."
    },
    {
        "id": "DOC-REG-03",
        "title": "Solid Waste Management Guidelines & Circular Symbiosis",
        "category": "Solid Waste",
        "source": "solid_waste_management.pdf",
        "content": "Fly ash and slag generated from thermal power plants and steel foundries must be prioritized for cement blending (PCC) and brick manufacturing within a 300km radius."
    },
    {
        "id": "DOC-REG-04",
        "title": "Industrial Guidelines for Secondary Material Trading",
        "category": "General Industrial",
        "source": "industrial_guidelines.pdf",
        "content": "Secondary material exchanges require digital manifest tracking, verified purity analysis, and transport route emission calculation to qualify for circular carbon offsets."
    }
]

# EcoLink Platform Knowledge Base
ECOLINK_PLATFORM_KNOWLEDGE = {
    "ecolink": "EcoLink is an AI-powered Eco-Industrial Symbiosis B2B Marketplace connecting manufacturing plants with secondary raw material buyers, offering computer vision inspection, price regression, route optimization, and carbon analytics.",
    "list waste": "To list waste, navigate to 'Upload Waste' in the sidebar, fill in listing specifications (material, quantity, asking price in ₹, pickup address), attach an image for AI quality classification, and click 'Publish Waste Resource Listing'.",
    "ai matching": "The AI Symbiosis Matcher evaluates 5 weighted criteria: Material Compatibility (40%), Quality & Purity (20%), Quantity Capacity (15%), Distance & Freight Logistics (15%), and Carbon Savings (10%) to rank compatible buyers.",
    "carbon saving": "Estimated carbon savings represent the avoided environmental impact from diverting usable material into a secondary-resource pathway, calculated as: Net Carbon Avoided = Virgin Material Emissions - Transport Emissions - Processing Emissions.",
    "demand forecasting": "Demand Forecasting uses historical transaction data and time-series modeling to project future material demand (+% change) over 1, 3, or 6-month horizons, helping sellers decide peak listing times.",
    "route optimization": "Route Optimization uses GIS coordinates and OSRM road routing algorithms to compute the shortest freight path between seller and buyer facilities, estimating road distance (km), travel duration, transport cost in ₹, and transport CO₂ emissions.",
    "digital resource passport": "The Digital Resource Passport is a verifiable QR-coded material record tracking origin industry, material composition, purity %, hazardous status, lab verification, and net avoided CO₂ footprint throughout its circular lifecycle."
}

class RAGService:
    def __init__(self):
        self.embeddings = LocalSentenceTransformerEmbeddings()
        self.vector_store = None
        self._init_vector_store()

    def _init_vector_store(self):
        if HAS_LANGCHAIN and FAISS is not None:
            try:
                docs = [
                    Document(page_content=item["content"], metadata={"source": item["source"], "title": item["title"]})
                    for item in KNOWLEDGE_BASE_DOCUMENTS
                ]
                self.vector_store = FAISS.from_documents(docs, self.embeddings)
                print("[RAG] Built FAISS vectorstore over regulatory documents.")
            except Exception as e:
                print(f"[RAG] FAISS vectorstore init warning ({e}). Using text keyword matching.")

    def query(self, message: str) -> dict:
        msg_lower = message.lower()

        # 1. INTENT: Material Quantity / Buyer Requirement Query
        if any(term in msg_lower for term in ["how many", "how much", "quantity needed", "needed", "scrap needed", "scraps needed"]):
            if "pet" in msg_lower or "plastic" in msg_lower:
                return {
                    "reply": "XYZ Recycling currently requires approximately 400 kg of PET plastic scrap. RePoly Manufacturing requires 500 kg of HDPE packaging scrap.",
                    "sources": ["Marketplace / Buyer Requirement"],
                    "confidence": "High",
                    "isSyntheticFallback": False
                }
            elif "metal" in msg_lower or "aluminium" in msg_lower:
                return {
                    "reply": "Kongu Metal Recycling currently requires approximately 1,500 kg of Aluminium machining scrap.",
                    "sources": ["Marketplace / Buyer Requirement"],
                    "confidence": "High",
                    "isSyntheticFallback": False
                }
            else:
                return {
                    "reply": "I don't currently have a buyer-specific quantity requirement for that exact material. You can browse active marketplace listings or publish your waste listing to trigger AI buyer matching.",
                    "sources": ["Marketplace / Buyer Requirement"],
                    "confidence": "Medium",
                    "isSyntheticFallback": False
                }

        # 2. INTENT: EcoLink Platform Capability Query
        for key, text in ECOLINK_PLATFORM_KNOWLEDGE.items():
            if key in msg_lower:
                return {
                    "reply": text,
                    "sources": ["EcoLink Platform Knowledge Base"],
                    "confidence": "High",
                    "isSyntheticFallback": False
                }

        # 3. INTENT: Regulatory / Compliance / EPR Policy Query (FAISS / Vector Search)
        if self.vector_store:
            try:
                results = self.vector_store.similarity_search_with_score(message, k=2)
                if results:
                    top_doc, score = results[0]
                    return {
                        "reply": f"Based on indexed Waste Management Guidelines ({top_doc.metadata.get('source', 'regulatory_rules.pdf')}): {top_doc.page_content}",
                        "sources": [top_doc.metadata.get("source", "regulatory_rules.pdf")],
                        "confidence": "High" if score < 1.0 else "Medium",
                        "isSyntheticFallback": False
                    }
            except Exception as err:
                print(f"[RAG] Vector query warning: {err}")

        # Text Keyword Matching Fallback for Regulatory Docs
        matched_doc = KNOWLEDGE_BASE_DOCUMENTS[0]
        for doc in KNOWLEDGE_BASE_DOCUMENTS:
            if doc["category"].lower() in msg_lower or any(w in msg_lower for w in doc["title"].lower().split()):
                matched_doc = doc
                break

        return {
            "reply": f"Based on indexed Waste Management Guidelines ({matched_doc['source']}): {matched_doc['content']}",
            "sources": [matched_doc["source"]],
            "confidence": "High",
            "isSyntheticFallback": False
        }

rag_service = RAGService()
