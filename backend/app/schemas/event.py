from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field

from app.models.enums import JobStatus, ProgressEventType


class ProgressEvent(BaseModel):
    job_id: uuid.UUID
    document_id: uuid.UUID
    stage: ProgressEventType
    progress_percentage: int = Field(ge=0, le=100)
    timestamp: datetime
    event_type: ProgressEventType
    status: JobStatus
    progress: int = Field(ge=0, le=100)
    message: str
    occurred_at: datetime
    error_message: str | None = None
    metadata: dict[str, Any] = Field(default_factory=dict)
