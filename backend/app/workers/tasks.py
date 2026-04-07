from __future__ import annotations

import asyncio
import logging
import uuid

from celery.exceptions import MaxRetriesExceededError

from app.core.database import AsyncSessionFactory
from app.repositories.document_repository import DocumentRepository
from app.repositories.extracted_data_repository import ExtractedDataRepository
from app.repositories.job_repository import JobRepository
from app.services.processing_service import ProcessingService
from app.services.progress_event_service import ProgressEventService
from app.workers.celery_app import celery_app


logger = logging.getLogger(__name__)

_worker_loop: asyncio.AbstractEventLoop | None = None


def _run_async(coro):
    """Run async worker code on one loop per Celery child process.

    SQLAlchemy async engines and redis.asyncio connections can keep loop-bound
    futures. Reusing a single loop avoids cross-loop failures when a worker
    processes multiple document jobs over its lifetime.
    """
    global _worker_loop

    if _worker_loop is None or _worker_loop.is_closed():
        _worker_loop = asyncio.new_event_loop()
        asyncio.set_event_loop(_worker_loop)

    return _worker_loop.run_until_complete(coro)


@celery_app.task(
    bind=True,
    name="app.workers.tasks.process_document_job",
    soft_time_limit=300,
    time_limit=360,
)
def process_document_job(self, job_id: str) -> dict[str, object]:
    try:
        return _run_async(_run_processing(job_id=job_id, celery_task_id=self.request.id))
    except (ConnectionError, TimeoutError, OSError) as exc:
        logger.warning("Retryable worker failure for job %s: %s", job_id, exc)
        _run_async(_requeue_job(job_id=job_id, reason=str(exc)))
        try:
            raise self.retry(exc=exc, countdown=min(60, 2 ** (self.request.retries + 1)), max_retries=3)
        except MaxRetriesExceededError:
            _run_async(_mark_failed(job_id=job_id, error_message=str(exc)))
            raise
    except Exception as exc:
        logger.exception("Worker failed for job %s", job_id)
        _run_async(_mark_failed(job_id=job_id, error_message=str(exc)))
        raise


async def _run_processing(*, job_id: str, celery_task_id: str) -> dict[str, object]:
    async with AsyncSessionFactory() as session:
        service = ProcessingService(
            session=session,
            document_repository=DocumentRepository(session),
            job_repository=JobRepository(session),
            extracted_data_repository=ExtractedDataRepository(session),
            progress_event_service=ProgressEventService(),
        )
        return await service.process(uuid.UUID(job_id), celery_task_id)


async def _mark_failed(*, job_id: str, error_message: str) -> None:
    async with AsyncSessionFactory() as session:
        service = ProcessingService(
            session=session,
            document_repository=DocumentRepository(session),
            job_repository=JobRepository(session),
            extracted_data_repository=ExtractedDataRepository(session),
            progress_event_service=ProgressEventService(),
        )
        await service.fail_job(uuid.UUID(job_id), error_message)


async def _requeue_job(*, job_id: str, reason: str) -> None:
    async with AsyncSessionFactory() as session:
        service = ProcessingService(
            session=session,
            document_repository=DocumentRepository(session),
            job_repository=JobRepository(session),
            extracted_data_repository=ExtractedDataRepository(session),
            progress_event_service=ProgressEventService(),
        )
        await service.requeue_job(uuid.UUID(job_id), reason)
