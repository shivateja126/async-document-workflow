from __future__ import annotations

from enum import StrEnum


class DocumentStatus(StrEnum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class JobStatus(StrEnum):
    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class ProgressEventType(StrEnum):
    JOB_RECEIVED = "job_received"
    JOB_QUEUED = "job_queued"
    JOB_STARTED = "job_started"
    DOCUMENT_VALIDATION_STARTED = "document_validation_started"
    DOCUMENT_VALIDATION_COMPLETED = "document_validation_completed"
    PARSING_STARTED = "parsing_started"
    PARSING_COMPLETED = "parsing_completed"
    EXTRACTION_STARTED = "extraction_started"
    EXTRACTION_COMPLETED = "extraction_completed"
    POST_PROCESSING_STARTED = "post_processing_started"
    POST_PROCESSING_COMPLETED = "post_processing_completed"
    SAVING_RESULTS = "saving_results"
    JOB_COMPLETED = "job_completed"
    JOB_FAILED = "job_failed"


class ExportFormat(StrEnum):
    JSON = "json"
    CSV = "csv"
