from __future__ import annotations

import logging
import uuid
from pathlib import Path

from fastapi import UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.models.document import Document
from app.models.enums import DocumentStatus, ExportFormat, JobStatus, ProgressEventType
from app.repositories.document_repository import DocumentRepository
from app.repositories.extracted_data_repository import ExtractedDataRepository
from app.repositories.job_repository import JobRepository
from app.schemas.common import PaginatedResponse, PaginationMeta
from app.schemas.document import (
    DocumentBatchUploadResponse,
    DocumentDetailRead,
    DocumentDeleteResponse,
    DocumentExportQuery,
    DocumentFinalizeResponse,
    DocumentListQuery,
    DocumentRead,
    DocumentUploadResponse,
)
from app.schemas.extracted_data import ExtractedDataRead, ExtractedDataReviewRequest
from app.schemas.job import JobRead
from app.services.progress_event_service import ProgressEventService
from app.utils.exporters import render_export
from app.utils.file_storage import LocalFileStorage


logger = logging.getLogger(__name__)


class DocumentService:
    def __init__(
        self,
        *,
        session: AsyncSession,
        document_repository: DocumentRepository,
        job_repository: JobRepository,
        extracted_data_repository: ExtractedDataRepository,
        progress_event_service: ProgressEventService,
        file_storage: LocalFileStorage,
    ) -> None:
        self.session = session
        self.document_repository = document_repository
        self.job_repository = job_repository
        self.extracted_data_repository = extracted_data_repository
        self.progress_event_service = progress_event_service
        self.file_storage = file_storage
        self.settings = get_settings()

    async def upload_document(self, upload_file: UploadFile) -> DocumentUploadResponse:
        self._validate_upload(upload_file)
        stored_file = await self.file_storage.save_upload(upload_file)

        if stored_file.size_bytes > self.settings.upload_max_size_bytes:
            self.file_storage.delete(stored_file.relative_path)
            raise AppError(
                code="file_too_large",
                message=f"Uploaded file exceeds the {self.settings.upload_max_size_mb} MB limit.",
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            )

        celery_task_id = str(uuid.uuid4())
        try:
            document = await self.document_repository.create(
                filename=upload_file.filename or Path(stored_file.relative_path).name,
                file_path=stored_file.relative_path,
                content_type=stored_file.content_type,
                size_bytes=stored_file.size_bytes,
                status=DocumentStatus.QUEUED.value,
            )
            job = await self.job_repository.create(
                document_id=document.id,
                celery_task_id=celery_task_id,
                status=JobStatus.QUEUED.value,
            )
            await self.session.commit()
        except Exception:
            await self.session.rollback()
            self.file_storage.delete(stored_file.relative_path)
            raise

        try:
            from app.workers.tasks import process_document_job

            process_document_job.apply_async(args=[str(job.id)], task_id=celery_task_id)
        except Exception as exc:
            logger.exception("Failed to enqueue job %s", job.id)
            await self._mark_enqueue_failure(document=document, job_id=job.id, error_message=str(exc))
            raise AppError(
                code="queue_unavailable",
                message="The job broker is unavailable. Please retry shortly.",
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            ) from exc

        return DocumentUploadResponse(
            document_id=document.id,
            job_id=job.id,
            status=DocumentStatus.QUEUED,
        )

    async def upload_documents(self, upload_files: list[UploadFile]) -> DocumentBatchUploadResponse:
        if not upload_files:
            raise AppError(
                code="invalid_file",
                message="At least one document is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

        uploaded_documents = []
        for upload_file in upload_files:
            uploaded_documents.append(await self.upload_document(upload_file))

        return DocumentBatchUploadResponse(items=uploaded_documents)

    async def list_documents(self, query: DocumentListQuery) -> PaginatedResponse[DocumentRead]:
        documents, total_items = await self.document_repository.list(query)
        items = [self._serialize_document(document, include_jobs=False) for document in documents]
        return PaginatedResponse(
            items=items,
            meta=PaginationMeta.from_counts(
                page=query.page,
                page_size=query.page_size,
                total_items=total_items,
            ),
        )

    async def get_document(self, document_id: uuid.UUID) -> DocumentDetailRead:
        document = await self.document_repository.get_by_id(document_id)
        if document is None:
            raise AppError(
                code="document_not_found",
                message="Document not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        return self._serialize_document(document, include_jobs=True)

    async def delete_document(self, document_id: uuid.UUID) -> DocumentDeleteResponse:
        document = await self.document_repository.get_by_id(document_id)
        if document is None:
            raise AppError(
                code="document_not_found",
                message="Document not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        if document.status in {DocumentStatus.QUEUED.value, DocumentStatus.PROCESSING.value}:
            raise AppError(
                code="document_delete_not_allowed",
                message="Wait for processing to finish before deleting this document.",
                status_code=status.HTTP_409_CONFLICT,
            )

        filename = document.filename
        file_path = document.file_path
        await self.document_repository.delete(document)
        await self.session.commit()

        try:
            self.file_storage.delete(file_path)
        except OSError:
            logger.warning("Deleted document %s but could not remove stored file %s", document_id, file_path)

        return DocumentDeleteResponse(
            document_id=document_id,
            filename=filename,
            deleted=True,
        )

    async def review_document(
        self,
        document_id: uuid.UUID,
        payload: ExtractedDataReviewRequest,
    ) -> DocumentDetailRead:
        document = await self.document_repository.get_by_id(document_id)
        if document is None:
            raise AppError(
                code="document_not_found",
                message="Document not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        if document.extracted_data is None:
            raise AppError(
                code="extracted_data_not_found",
                message="Document has no extracted data to review yet.",
                status_code=status.HTTP_409_CONFLICT,
            )

        await self.extracted_data_repository.apply_review(
            document.extracted_data,
            title=payload.title,
            category=payload.category,
            summary=payload.summary,
            keywords=payload.keywords,
        )
        await self.session.commit()
        await self.session.refresh(document, attribute_names=["jobs", "extracted_data"])
        return self._serialize_document(document, include_jobs=True)

    async def finalize_document(self, document_id: uuid.UUID) -> DocumentFinalizeResponse:
        document = await self.document_repository.get_by_id(document_id)
        if document is None:
            raise AppError(
                code="document_not_found",
                message="Document not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        if document.extracted_data is None:
            raise AppError(
                code="extracted_data_not_found",
                message="Document has no extracted data to finalize.",
                status_code=status.HTTP_409_CONFLICT,
            )

        await self.extracted_data_repository.finalize(document.extracted_data)
        await self.session.commit()
        await self.session.refresh(document, attribute_names=["jobs", "extracted_data"])
        return DocumentFinalizeResponse(
            document=self._serialize_document(document, include_jobs=True),
            finalized=True,
        )

    async def export_document(
        self,
        document_id: uuid.UUID,
        query: DocumentExportQuery,
    ) -> tuple[bytes, str, str]:
        document = await self.document_repository.get_by_id(document_id)
        if document is None:
            raise AppError(
                code="document_not_found",
                message="Document not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )
        if document.extracted_data is None:
            raise AppError(
                code="document_not_ready",
                message="Document is not ready for export yet.",
                status_code=status.HTTP_409_CONFLICT,
            )
        if not document.extracted_data.finalized:
            raise AppError(
                code="document_not_finalized",
                message="Finalize the reviewed output before exporting this document.",
                status_code=status.HTTP_409_CONFLICT,
            )
        latest_job = document.jobs[0] if document.jobs else None
        content, media_type = render_export(
            export_format=ExportFormat(query.format),
            document=document,
            extracted_data=document.extracted_data,
            latest_job=latest_job,
        )
        extension = "json" if query.format == ExportFormat.JSON else "csv"
        export_name = f"{Path(document.filename).stem}-extracted.{extension}"
        return content, media_type, export_name

    async def _mark_enqueue_failure(
        self,
        *,
        document: Document,
        job_id: uuid.UUID,
        error_message: str,
    ) -> None:
        document.status = DocumentStatus.FAILED.value
        job = await self.job_repository.get_by_id(job_id)
        if job is not None:
            await self.job_repository.mark_failed(job, error_message=error_message)
        await self.session.commit()
        await self.progress_event_service.publish(
            job_id=job_id,
            document_id=document.id,
            event_type=ProgressEventType.JOB_FAILED,
            status=JobStatus.FAILED,
            progress=0,
            message="Failed to enqueue document processing job.",
            error_message=error_message,
        )

    def _validate_upload(self, upload_file: UploadFile) -> None:
        filename = upload_file.filename or ""
        extension = Path(filename).suffix.lower().lstrip(".")
        if not filename:
            raise AppError(
                code="invalid_file",
                message="A file name is required.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if extension not in self.settings.allowed_file_extensions:
            allowed = ", ".join(sorted(self.settings.allowed_file_extensions))
            raise AppError(
                code="unsupported_extension",
                message=f"Unsupported file type. Allowed extensions: {allowed}.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )

    def _serialize_document(self, document: Document, *, include_jobs: bool) -> DocumentRead | DocumentDetailRead:
        latest_job = document.jobs[0] if document.jobs else None
        payload = {
            "id": document.id,
            "filename": document.filename,
            "file_path": document.file_path,
            "status": document.status,
            "content_type": document.content_type,
            "size_bytes": document.size_bytes,
            "created_at": document.created_at,
            "updated_at": document.updated_at,
            "latest_job": JobRead.model_validate(latest_job) if latest_job else None,
            "extracted_data": ExtractedDataRead.model_validate(document.extracted_data)
            if document.extracted_data
            else None,
        }
        if include_jobs:
            payload["jobs"] = [JobRead.model_validate(job) for job in document.jobs]
            return DocumentDetailRead.model_validate(payload)
        return DocumentRead.model_validate(payload)
