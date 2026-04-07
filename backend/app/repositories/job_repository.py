from __future__ import annotations

import uuid
from datetime import UTC, datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload

from app.models.job import Job


class JobRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        document_id: uuid.UUID,
        celery_task_id: str,
        status: str,
        progress: int = 0,
        attempt_number: int = 1,
    ) -> Job:
        job = Job(
            document_id=document_id,
            celery_task_id=celery_task_id,
            status=status,
            progress=progress,
            attempt_number=attempt_number,
        )
        self.session.add(job)
        await self.session.flush()
        return job

    async def get_by_id(self, job_id: uuid.UUID) -> Job | None:
        result = await self.session.execute(
            select(Job).where(Job.id == job_id).options(joinedload(Job.document))
        )
        return result.scalar_one_or_none()

    async def get_by_id_for_update(self, job_id: uuid.UUID) -> Job | None:
        result = await self.session.execute(
            select(Job)
            .where(Job.id == job_id)
            .options(joinedload(Job.document, innerjoin=True))
            .with_for_update(of=Job)
        )
        return result.scalar_one_or_none()

    async def list_by_document(self, document_id: uuid.UUID) -> list[Job]:
        result = await self.session.execute(
            select(Job).where(Job.document_id == document_id).order_by(Job.created_at.desc())
        )
        return list(result.scalars().all())

    async def clone_for_retry(self, job: Job, celery_task_id: str) -> Job:
        retry_job = Job(
            document_id=job.document_id,
            celery_task_id=celery_task_id,
            status="queued",
            progress=0,
            attempt_number=job.attempt_number + 1,
        )
        self.session.add(retry_job)
        await self.session.flush()
        return retry_job

    async def mark_processing(self, job: Job, *, celery_task_id: str) -> Job:
        job.celery_task_id = celery_task_id
        job.status = "processing"
        job.progress = max(job.progress, 5)
        job.error_message = None
        if job.started_at is None:
            job.started_at = datetime.now(UTC)
        await self.session.flush()
        return job

    async def mark_progress(self, job: Job, *, progress: int, status: str | None = None) -> Job:
        job.progress = progress
        if status is not None:
            job.status = status
        await self.session.flush()
        return job

    async def mark_completed(self, job: Job) -> Job:
        job.status = "completed"
        job.progress = 100
        job.error_message = None
        job.completed_at = datetime.now(UTC)
        await self.session.flush()
        return job

    async def mark_failed(self, job: Job, *, error_message: str) -> Job:
        job.status = "failed"
        job.error_message = error_message
        job.completed_at = datetime.now(UTC)
        await self.session.flush()
        return job
