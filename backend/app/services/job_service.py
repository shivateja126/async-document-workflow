from __future__ import annotations

import logging
import uuid

from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import AppError
from app.models.enums import DocumentStatus, JobStatus
from app.repositories.document_repository import DocumentRepository
from app.repositories.job_repository import JobRepository
from app.schemas.job import JobRead, RetryJobResponse
from app.services.progress_event_service import ProgressEventService


logger = logging.getLogger(__name__)


class JobService:
    def __init__(
        self,
        *,
        session: AsyncSession,
        document_repository: DocumentRepository,
        job_repository: JobRepository,
        progress_event_service: ProgressEventService,
    ) -> None:
        self.session = session
        self.document_repository = document_repository
        self.job_repository = job_repository
        self.progress_event_service = progress_event_service

    async def get_job(self, job_id: uuid.UUID) -> JobRead:
        job = await self.job_repository.get_by_id(job_id)
        if job is None:
            raise AppError(
                code="job_not_found",
                message="Job not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return JobRead.model_validate(job)

    async def retry_job(self, job_id: uuid.UUID) -> RetryJobResponse:
        existing_job = await self.job_repository.get_by_id(job_id)
        if existing_job is None:
            raise AppError(
                code="job_not_found",
                message="Job not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        if existing_job.status != JobStatus.FAILED.value:
            raise AppError(
                code="job_retry_not_allowed",
                message="Only failed jobs can be retried.",
                status_code=status.HTTP_409_CONFLICT,
            )
        if existing_job.document is None:
            raise AppError(
                code="document_not_found",
                message="Associated document not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        celery_task_id = str(uuid.uuid4())
        retry_job = await self.job_repository.clone_for_retry(existing_job, celery_task_id)
        existing_job.document.status = DocumentStatus.QUEUED.value
        await self.session.commit()

        try:
            from app.workers.tasks import process_document_job

            process_document_job.apply_async(args=[str(retry_job.id)], task_id=celery_task_id)
        except Exception as exc:
            logger.exception("Failed to enqueue retry job %s", retry_job.id)
            retry_job.status = JobStatus.FAILED.value
            retry_job.error_message = str(exc)
            existing_job.document.status = DocumentStatus.FAILED.value
            await self.session.commit()
            raise AppError(
                code="queue_unavailable",
                message="The retry could not be queued.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            ) from exc

        return RetryJobResponse(
            original_job_id=existing_job.id,
            retry_job=JobRead.model_validate(retry_job),
        )
