from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class JobRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_id: uuid.UUID
    status: str
    progress: int
    error_message: str | None
    celery_task_id: str
    attempt_number: int
    created_at: datetime
    updated_at: datetime
    started_at: datetime | None
    completed_at: datetime | None


class RetryJobResponse(BaseModel):
    original_job_id: uuid.UUID
    retry_job: JobRead
