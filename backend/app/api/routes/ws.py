from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, WebSocket

from app.api.dependencies import get_realtime_service
from app.services.realtime_service import RealtimeProgressService


router = APIRouter()


@router.websocket("/ws/progress/{job_id}")
async def stream_job_progress(
    websocket: WebSocket,
    job_id: uuid.UUID,
    realtime_service: RealtimeProgressService = Depends(get_realtime_service),
) -> None:
    await realtime_service.stream_job_progress(websocket, job_id)
