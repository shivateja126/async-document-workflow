from __future__ import annotations

from dataclasses import dataclass

from app.models.enums import ProgressEventType


@dataclass(frozen=True, slots=True)
class PipelineStageDefinition:
    stage: ProgressEventType
    progress_percentage: int
    message: str
    delay_seconds: float


PIPELINE_STAGE_DEFINITIONS: tuple[PipelineStageDefinition, ...] = (
    PipelineStageDefinition(
        stage=ProgressEventType.JOB_RECEIVED,
        progress_percentage=2,
        message="Worker received the job payload from the queue.",
        delay_seconds=0.35,
    ),
    PipelineStageDefinition(
        stage=ProgressEventType.JOB_QUEUED,
        progress_percentage=5,
        message="Job is registered in the processing queue.",
        delay_seconds=0.45,
    ),
    PipelineStageDefinition(
        stage=ProgressEventType.JOB_STARTED,
        progress_percentage=9,
        message="Celery worker started the document pipeline.",
        delay_seconds=0.5,
    ),
    PipelineStageDefinition(
        stage=ProgressEventType.DOCUMENT_VALIDATION_STARTED,
        progress_percentage=14,
        message="Validating document metadata, size, and file type.",
        delay_seconds=0.65,
    ),
    PipelineStageDefinition(
        stage=ProgressEventType.DOCUMENT_VALIDATION_COMPLETED,
        progress_percentage=22,
        message="Document validation completed successfully.",
        delay_seconds=0.55,
    ),
    PipelineStageDefinition(
        stage=ProgressEventType.PARSING_STARTED,
        progress_percentage=30,
        message="Parsing document content and preparing text blocks.",
        delay_seconds=1.0,
    ),
    PipelineStageDefinition(
        stage=ProgressEventType.PARSING_COMPLETED,
        progress_percentage=45,
        message="Parsing completed and normalized sections are ready.",
        delay_seconds=0.6,
    ),
    PipelineStageDefinition(
        stage=ProgressEventType.EXTRACTION_STARTED,
        progress_percentage=55,
        message="Extracting structured fields from parsed content.",
        delay_seconds=1.1,
    ),
    PipelineStageDefinition(
        stage=ProgressEventType.EXTRACTION_COMPLETED,
        progress_percentage=70,
        message="Structured extraction completed.",
        delay_seconds=0.6,
    ),
    PipelineStageDefinition(
        stage=ProgressEventType.POST_PROCESSING_STARTED,
        progress_percentage=78,
        message="Post-processing extracted fields and confidence signals.",
        delay_seconds=0.8,
    ),
    PipelineStageDefinition(
        stage=ProgressEventType.POST_PROCESSING_COMPLETED,
        progress_percentage=86,
        message="Post-processing completed and review payload is normalized.",
        delay_seconds=0.5,
    ),
    PipelineStageDefinition(
        stage=ProgressEventType.SAVING_RESULTS,
        progress_percentage=92,
        message="Saving extracted data and audit metadata.",
        delay_seconds=0.4,
    ),
    PipelineStageDefinition(
        stage=ProgressEventType.JOB_COMPLETED,
        progress_percentage=100,
        message="Document processing completed successfully.",
        delay_seconds=0,
    ),
)

PIPELINE_STAGE_BY_EVENT = {definition.stage: definition for definition in PIPELINE_STAGE_DEFINITIONS}

