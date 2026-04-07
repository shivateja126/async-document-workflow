from __future__ import annotations

from fastapi import APIRouter, Depends

from app.api.dependencies import get_health_service
from app.services.health_service import HealthService


router = APIRouter()


@router.get("/health/live")
async def health_live(health_service: HealthService = Depends(get_health_service)) -> dict[str, str]:
    return await health_service.liveness()


@router.get("/health/ready")
async def health_ready(health_service: HealthService = Depends(get_health_service)) -> dict[str, str]:
    return await health_service.readiness()
