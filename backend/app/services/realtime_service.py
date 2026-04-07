from __future__ import annotations

import asyncio
import json
import logging
import uuid

from fastapi import WebSocket, WebSocketDisconnect

from app.core.config import get_settings
from app.core.database import AsyncSessionFactory
from app.core.redis import get_redis_client
from app.repositories.job_repository import JobRepository
from app.services.progress_event_service import ProgressEventService


logger = logging.getLogger(__name__)


class RealtimeProgressService:
    def __init__(
        self,
        *,
        progress_event_service: ProgressEventService,
    ) -> None:
        self.progress_event_service = progress_event_service
        self.redis = get_redis_client()
        self.settings = get_settings()

    async def stream_job_progress(self, websocket: WebSocket, job_id: uuid.UUID) -> None:
        async with AsyncSessionFactory() as session:
            job = await JobRepository(session).get_by_id(job_id)
        if job is None:
            await websocket.close(code=4404, reason="Job not found")
            return

        await websocket.accept()
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(self.progress_event_service.channel_name(job_id))

        event_history = await self.progress_event_service.history_for_job(job_id)
        if event_history:
            for payload in event_history:
                await websocket.send_text(payload)
        else:
            await websocket.send_text(self.progress_event_service.snapshot_for_job(job))

        try:
            while True:
                message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=1.0)
                if message and message.get("type") == "message":
                    payload = message.get("data")
                    if isinstance(payload, str):
                        await websocket.send_text(payload)
                        if _is_terminal_event(payload):
                            continue
                await asyncio.sleep(0.1)
        except WebSocketDisconnect:
            logger.info("WebSocket disconnected for job %s", job_id)
        finally:
            await pubsub.unsubscribe(self.progress_event_service.channel_name(job_id))
            await pubsub.close()


def _is_terminal_event(payload: str) -> bool:
    try:
        event_type = json.loads(payload).get("event_type")
    except json.JSONDecodeError:
        return False
    return event_type in {"job_completed", "job_failed"}
