from fastapi import APIRouter
from pydantic import BaseModel
from typing import List
from app.services.route_service import route_service

router = APIRouter()

class RouteRequest(BaseModel):
    coordinates: List[List[float]]

@router.post("/optimize")
async def optimize(req: RouteRequest):
    result = route_service.optimize_route(req.coordinates)
    return result
