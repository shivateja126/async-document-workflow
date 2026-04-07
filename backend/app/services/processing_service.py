from __future__ import annotations

import asyncio
import logging
import uuid
from pathlib import Path

from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import get_settings
from app.core.exceptions import AppError
from app.models.enums import DocumentStatus, JobStatus, ProgressEventType
from app.repositories.document_repository import DocumentRepository
from app.repositories.extracted_data_repository import ExtractedDataRepository
from app.repositories.job_repository import JobRepository
from app.services.pipeline_stages import PIPELINE_STAGE_BY_EVENT, PIPELINE_STAGE_DEFINITIONS
from app.services.progress_event_service import ProgressEventService


logger = logging.getLogger(__name__)


class ProcessingService:
    def __init__(
        self,
        *,
        session: AsyncSession,
        document_repository: DocumentRepository,
        job_repository: JobRepository,
        extracted_data_repository: ExtractedDataRepository,
        progress_event_service: ProgressEventService,
    ) -> None:
        self.session = session
        self.document_repository = document_repository
        self.job_repository = job_repository
        self.extracted_data_repository = extracted_data_repository
        self.progress_event_service = progress_event_service
        self.settings = get_settings()

    async def process(self, job_id: uuid.UUID, celery_task_id: str) -> dict[str, object]:
        job = await self.job_repository.get_by_id_for_update(job_id)
        if job is None or job.document is None:
            raise AppError(
                code="job_not_found",
                message="Job not found.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

        existing_extracted_data = await self.extracted_data_repository.get_by_document_id(job.document_id)
        if job.status == JobStatus.COMPLETED.value and existing_extracted_data is not None:
            logger.info("Skipping already completed job %s", job.id)
            return {"job_id": str(job.id), "status": job.status, "idempotent": True}

        await self._emit_stage(job_id=job.id, stage=ProgressEventType.JOB_RECEIVED)
        await self._emit_stage(job_id=job.id, stage=ProgressEventType.JOB_QUEUED)
        await self._emit_stage(
            job_id=job.id,
            stage=ProgressEventType.JOB_STARTED,
            celery_task_id=celery_task_id,
        )

        await self._emit_stage(job_id=job.id, stage=ProgressEventType.DOCUMENT_VALIDATION_STARTED)
        self._validate_document(
            filename=job.document.filename,
            file_path=job.document.file_path,
            size_bytes=job.document.size_bytes,
        )
        await self._emit_stage(
            job_id=job.id,
            stage=ProgressEventType.DOCUMENT_VALIDATION_COMPLETED,
            message=f"Validated {job.document.filename} ({job.document.size_bytes:,} bytes).",
        )

        await self._emit_stage(job_id=job.id, stage=ProgressEventType.PARSING_STARTED)
        parsed_document = self._parse_document(
            filename=job.document.filename,
            file_path=job.document.file_path,
            size_bytes=job.document.size_bytes,
        )
        await self._emit_stage(
            job_id=job.id,
            stage=ProgressEventType.PARSING_COMPLETED,
            message=(
                "Parsed document structure into "
                f"{parsed_document['section_count']} sections and {parsed_document['token_count']} tokens."
            ),
            metadata=parsed_document,
        )

        await self._emit_stage(job_id=job.id, stage=ProgressEventType.EXTRACTION_STARTED)

        extracted_payload = self._build_extracted_payload(
            filename=job.document.filename,
            file_path=job.document.file_path,
            size_bytes=job.document.size_bytes,
        )
        await self._emit_stage(
            job_id=job.id,
            stage=ProgressEventType.EXTRACTION_COMPLETED,
            message=f"Extracted {len(extracted_payload['keywords'])} keywords and a review summary.",
            metadata={
                "extracted_fields": ["title", "category", "summary", "keywords"],
                "keyword_count": len(extracted_payload["keywords"]),
            },
        )

        await self._emit_stage(job_id=job.id, stage=ProgressEventType.POST_PROCESSING_STARTED)
        extracted_payload = self._post_process_payload(extracted_payload)
        await self._emit_stage(
            job_id=job.id,
            stage=ProgressEventType.POST_PROCESSING_COMPLETED,
            message="Normalized extracted fields and prepared the review record.",
            metadata={
                "title": str(extracted_payload["title"]),
                "category": str(extracted_payload["category"]),
            },
        )

        await self._emit_stage(job_id=job.id, stage=ProgressEventType.SAVING_RESULTS)
        await self.extracted_data_repository.upsert(
            document_id=job.document_id,
            title=extracted_payload["title"],
            category=extracted_payload["category"],
            summary=extracted_payload["summary"],
            keywords=extracted_payload["keywords"],
            finalized=False,
        )
        await self.session.commit()
        await self._emit_stage(job_id=job.id, stage=ProgressEventType.JOB_COMPLETED)
        return {"job_id": str(job.id), "status": job.status, "idempotent": False}

    async def fail_job(self, job_id: uuid.UUID, error_message: str) -> None:
        job = await self.job_repository.get_by_id(job_id)
        if job is None or job.document is None:
            return
        await self.job_repository.mark_failed(job, error_message=error_message)
        job.document.status = DocumentStatus.FAILED.value
        await self.session.commit()
        await self.progress_event_service.publish(
            job_id=job.id,
            document_id=job.document_id,
            event_type=ProgressEventType.JOB_FAILED,
            status=JobStatus.FAILED,
            progress=job.progress,
            message="Document processing failed.",
            error_message=error_message,
            metadata=self._stage_metadata(ProgressEventType.JOB_FAILED),
        )

    async def requeue_job(self, job_id: uuid.UUID, reason: str) -> None:
        job = await self.job_repository.get_by_id(job_id)
        if job is None or job.document is None:
            return
        job.status = JobStatus.QUEUED.value
        job.document.status = DocumentStatus.QUEUED.value
        job.error_message = reason
        await self.session.commit()
        await self.progress_event_service.publish(
            job_id=job.id,
            document_id=job.document_id,
            event_type=ProgressEventType.JOB_QUEUED,
            status=JobStatus.QUEUED,
            progress=job.progress,
            message="Job re-queued after a transient worker failure.",
            error_message=reason,
            metadata={**self._stage_metadata(ProgressEventType.JOB_QUEUED), "retry_scheduled": True},
        )

    async def _emit_stage(
        self,
        *,
        job_id: uuid.UUID,
        stage: ProgressEventType,
        celery_task_id: str | None = None,
        message: str | None = None,
        metadata: dict[str, object] | None = None,
    ) -> None:
        job = await self.job_repository.get_by_id(job_id)
        if job is None or job.document is None:
            raise RuntimeError(f"Job {job_id} not found while advancing stage.")

        definition = PIPELINE_STAGE_BY_EVENT[stage]
        job_status = JobStatus.QUEUED if stage in {ProgressEventType.JOB_RECEIVED, ProgressEventType.JOB_QUEUED} else JobStatus.PROCESSING
        document_status = DocumentStatus.QUEUED if job_status == JobStatus.QUEUED else DocumentStatus.PROCESSING

        if stage == ProgressEventType.JOB_STARTED and celery_task_id is not None:
            await self.job_repository.mark_processing(job, celery_task_id=celery_task_id)
            await self.job_repository.mark_progress(
                job,
                progress=definition.progress_percentage,
                status=JobStatus.PROCESSING.value,
            )
        elif stage == ProgressEventType.JOB_COMPLETED:
            await self.job_repository.mark_completed(job)
            job_status = JobStatus.COMPLETED
            document_status = DocumentStatus.COMPLETED
        else:
            await self.job_repository.mark_progress(
                job,
                progress=definition.progress_percentage,
                status=job_status.value,
            )

        job.document.status = document_status.value
        await self.session.commit()
        await self.progress_event_service.publish(
            job_id=job_id,
            document_id=job.document_id,
            event_type=stage,
            status=job_status,
            progress=definition.progress_percentage,
            message=message or definition.message,
            metadata={**self._stage_metadata(stage), **(metadata or {})},
        )
        if definition.delay_seconds > 0:
            await asyncio.sleep(definition.delay_seconds)

    def _stage_metadata(self, stage: ProgressEventType) -> dict[str, object]:
        normal_stages = [definition.stage for definition in PIPELINE_STAGE_DEFINITIONS]
        if stage in normal_stages:
            index = normal_stages.index(stage)
            estimated_remaining = sum(
                definition.delay_seconds for definition in PIPELINE_STAGE_DEFINITIONS[index + 1 :]
            )
            sequence = index + 1
        else:
            estimated_remaining = 0
            sequence = len(normal_stages) + 1

        return {
            "sequence": sequence,
            "total_stages": len(normal_stages) + 1,
            "estimated_remaining_seconds": round(estimated_remaining, 1),
            "stage_label": stage.value.replace("_", " ").title(),
        }

    def _validate_document(self, *, filename: str, file_path: str, size_bytes: int) -> None:
        extension = Path(filename).suffix.lower().lstrip(".")
        if extension not in self.settings.allowed_file_extensions:
            raise AppError(
                code="unsupported_file",
                message=f"Unsupported file type: {extension or 'unknown'}.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        if size_bytes <= 0:
            raise AppError(
                code="empty_file",
                message="The uploaded document is empty.",
                status_code=status.HTTP_400_BAD_REQUEST,
            )
        absolute_path = self.settings.storage_root / file_path
        if not absolute_path.exists():
            raise AppError(
                code="file_missing",
                message="The uploaded file could not be found in storage.",
                status_code=status.HTTP_404_NOT_FOUND,
            )

    def _parse_document(self, *, filename: str, file_path: str, size_bytes: int) -> dict[str, object]:
        extension = Path(filename).suffix.lower().lstrip(".") or "file"
        section_count = max(1, min(9, size_bytes // 24_000 + 1))
        token_count = max(32, min(2_400, size_bytes // 12))
        return {
            "parser": f"{extension}-metadata-parser",
            "source_path": file_path,
            "section_count": section_count,
            "token_count": token_count,
        }

    def _build_extracted_payload(
        self,
        *,
        filename: str,
        file_path: str,
        size_bytes: int,
    ) -> dict[str, object]:
        file_stem = Path(filename).stem.replace("-", " ").replace("_", " ").strip() or "Untitled"
        extension = Path(filename).suffix.lower().lstrip(".") or "file"
        category = self._categorize_extension(extension)
        keywords = [
            extension,
            category.lower(),
            "simulated",
            "structured-output",
            "document-workflow",
        ]
        summary = (
            f"Simulated extraction for {filename}. The worker parsed {size_bytes} bytes from "
            f"{file_path} and produced a normalized review-ready record."
        )
        return {
            "title": file_stem.title(),
            "category": category,
            "summary": summary,
            "keywords": keywords,
        }

    @staticmethod
    def _post_process_payload(payload: dict[str, object]) -> dict[str, object]:
        keywords = payload.get("keywords", [])
        if isinstance(keywords, list):
            normalized_keywords = sorted({str(keyword).strip().lower() for keyword in keywords if str(keyword).strip()})
        else:
            normalized_keywords = []

        return {
            **payload,
            "title": str(payload["title"]).strip() or "Untitled Document",
            "category": str(payload["category"]).strip() or "General",
            "summary": str(payload["summary"]).strip(),
            "keywords": normalized_keywords,
        }

    @staticmethod
    def _categorize_extension(extension: str) -> str:
        mapping = {
            "pdf": "Contract",
            "txt": "Text",
            "doc": "Report",
            "docx": "Report",
            "md": "Notes",
            "png": "Image",
            "jpg": "Image",
            "jpeg": "Image",
        }
        return mapping.get(extension, "General")
