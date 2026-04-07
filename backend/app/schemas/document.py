from __future__ import annotations

import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field

from app.models.enums import DocumentStatus, ExportFormat
from app.schemas.common import PaginationParams, SortOrder
from app.schemas.extracted_data import ExtractedDataRead
from app.schemas.job import JobRead


class DocumentSortBy(StrEnum):
    CREATED_AT = "created_at"
    UPDATED_AT = "updated_at"
    FILENAME = "filename"
    STATUS = "status"


class DocumentListQuery(PaginationParams):
    search: str | None = Field(default=None, max_length=255)
    status: DocumentStatus | None = None
    sort_by: DocumentSortBy = DocumentSortBy.UPDATED_AT
    sort_order: SortOrder = SortOrder.DESC


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    filename: str
    file_path: str
    status: str
    content_type: str | None
    size_bytes: int
    created_at: datetime
    updated_at: datetime
    latest_job: JobRead | None = None
    extracted_data: ExtractedDataRead | None = None


class DocumentDetailRead(DocumentRead):
    jobs: list[JobRead] = Field(default_factory=list)


class DocumentUploadResponse(BaseModel):
    document_id: uuid.UUID
    job_id: uuid.UUID
    status: DocumentStatus


class DocumentBatchUploadResponse(BaseModel):
    items: list[DocumentUploadResponse]


class DocumentDeleteResponse(BaseModel):
    document_id: uuid.UUID
    filename: str
    deleted: bool


class DocumentFinalizeResponse(BaseModel):
    document: DocumentDetailRead
    finalized: bool


class DocumentExportQuery(BaseModel):
    format: ExportFormat = ExportFormat.JSON
