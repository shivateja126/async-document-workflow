from __future__ import annotations

import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, model_validator


class ExtractedDataRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    document_id: uuid.UUID
    title: str
    category: str
    summary: str
    keywords: list[str]
    finalized: bool
    created_at: datetime
    updated_at: datetime


class ExtractedDataReviewRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=255)
    category: str | None = Field(default=None, min_length=1, max_length=128)
    summary: str | None = Field(default=None, min_length=1)
    keywords: list[str] | None = None

    @model_validator(mode="after")
    def validate_non_empty_payload(self) -> "ExtractedDataReviewRequest":
        if not any(
            value is not None
            for value in (self.title, self.category, self.summary, self.keywords)
        ):
            raise ValueError("At least one field must be provided for review updates.")
        return self
