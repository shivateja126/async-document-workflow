from __future__ import annotations

import json
import logging
import uuid
from datetime import UTC, datetime

from app.core.config import get_settings
from app.core.redis import get_redis_client
from app.models.job import Job
from app.models.enums import JobStatus, ProgressEventType
from app.schemas.event import ProgressEvent


logger = logging.getLogger(__name__)


class ProgressEventService:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.redis = get_redis_client()

    def channel_name(self, job_id: uuid.UUID | str) -> str:
        return f"{self.settings.progress_channel_prefix}:{job_id}"

    def history_key(self, job_id: uuid.UUID | str) -> str:
        return f"{self.settings.progress_channel_prefix}:history:{job_id}"

    async def publish(
        self,
        *,
        job_id: uuid.UUID,
        document_id: uuid.UUID,
        event_type: ProgressEventType,
        status: JobStatus,
        progress: int,
        message: str,
        error_message: str | None = None,
        metadata: dict[str, object] | None = None,
    ) -> ProgressEvent:
        timestamp = datetime.now(UTC)
        progress_percentage = max(0, min(100, progress))
        event = ProgressEvent(
            job_id=job_id,
            document_id=document_id,
            stage=event_type,
            progress_percentage=progress_percentage,
            timestamp=timestamp,
            event_type=event_type,
            status=status,
            progress=progress_percentage,
            message=message,
            error_message=error_message,
            metadata=metadata or {},
            occurred_at=timestamp,
        )
        payload = event.model_dump_json()
        await self.redis.rpush(self.history_key(job_id), payload)
        await self.redis.ltrim(self.history_key(job_id), -50, -1)
        await self.redis.expire(self.history_key(job_id), 60 * 60 * 24)
        await self.redis.publish(self.channel_name(job_id), payload)
        logger.info("Published progress event %s for job %s", event_type.value, job_id)
        return event

    async def history_for_job(self, job_id: uuid.UUID | str) -> list[str]:
        return list(await self.redis.lrange(self.history_key(job_id), 0, -1))

    def snapshot_for_job(self, job: Job) -> str:
        event_type = self._status_to_event(JobStatus(job.status))
        timestamp = datetime.now(UTC)
        event = ProgressEvent(
            job_id=job.id,
            document_id=job.document_id,
            stage=event_type,
            progress_percentage=job.progress,
            timestamp=timestamp,
            event_type=event_type,
            status=JobStatus(job.status),
            progress=job.progress,
            message=f"Job snapshot: {job.status}.",
            error_message=job.error_message,
            metadata={"snapshot": True},
            occurred_at=timestamp,
        )
        return json.dumps(event.model_dump(mode="json"))

    @staticmethod
    def _status_to_event(status: JobStatus) -> ProgressEventType:
        mapping = {
            JobStatus.QUEUED: ProgressEventType.JOB_QUEUED,
            JobStatus.PROCESSING: ProgressEventType.JOB_STARTED,
            JobStatus.COMPLETED: ProgressEventType.JOB_COMPLETED,
            JobStatus.FAILED: ProgressEventType.JOB_FAILED,
        }
        return mapping[status]
