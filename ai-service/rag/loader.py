import os
from typing import List, Dict, Any

class DocumentLoader:
    def __init__(self, doc_dir: str = "rag/documents"):
        self.doc_dir = doc_dir

    def load_documents(self) -> List[Dict[str, Any]]:
        documents = []
        if not os.path.exists(self.doc_dir):
            return documents

        for root, _, files in os.walk(self.doc_dir):
            for file in files:
                if file.endswith((".pdf", ".txt", ".md")):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                            content = f.read()
                        documents.append({
                            "source": file,
                            "path": file_path,
                            "content": content
                        })
                    except Exception as e:
                        print(f"[RAG Loader] Failed to load {file_path}: {e}")
        return documents

loader = DocumentLoader()
