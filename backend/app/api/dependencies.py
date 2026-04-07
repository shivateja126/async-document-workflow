from __future__ import annotations

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.database import get_db_session
from app.repositories.document_repository import DocumentRepository
from app.repositories.extracted_data_repository import ExtractedDataRepository
from app.repositories.job_repository import JobRepository
from app.services.document_service import DocumentService
from app.services.health_service import HealthService
from app.services.job_service import JobService
from app.services.processing_service import ProcessingService
from app.services.progress_event_service import ProgressEventService
from app.services.realtime_service import RealtimeProgressService
from app.utils.file_storage import LocalFileStorage


def get_document_service(session: AsyncSession = Depends(get_db_session)) -> DocumentService:
    settings = get_settings()
    return DocumentService(
        session=session,
        document_repository=DocumentRepository(session),
        job_repository=JobRepository(session),
        extracted_data_repository=ExtractedDataRepository(session),
        progress_event_service=ProgressEventService(),
        file_storage=LocalFileStorage(settings.storage_root),
    )


def get_job_service(session: AsyncSession = Depends(get_db_session)) -> JobService:
    return JobService(
        session=session,
        document_repository=DocumentRepository(session),
        job_repository=JobRepository(session),
        progress_event_service=ProgressEventService(),
    )


def get_realtime_service() -> RealtimeProgressService:
    return RealtimeProgressService(
        progress_event_service=ProgressEventService(),
    )


def get_processing_service(session: AsyncSession = Depends(get_db_session)) -> ProcessingService:
    return ProcessingService(
        session=session,
        document_repository=DocumentRepository(session),
        job_repository=JobRepository(session),
        extracted_data_repository=ExtractedDataRepository(session),
        progress_event_service=ProgressEventService(),
    )


def get_health_service() -> HealthService:
    return HealthService()
