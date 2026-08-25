from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.services.rag_service import rag_service

router = APIRouter()

class ChatMessage(BaseModel):
    role: str
    content: str

class QueryRequest(BaseModel):
    message: str
    history: Optional[List[ChatMessage]] = []

@router.post("/query")
async def query_bot(req: QueryRequest):
    history_list = [{"role": msg.role, "content": msg.content} for msg in req.history] if req.history else []
    result = rag_service.query(req.message, history_list)
    return result
