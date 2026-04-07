from __future__ import annotations

import csv
import io
import json
from collections.abc import Iterable

from app.models.document import Document
from app.models.extracted_data import ExtractedData
from app.models.job import Job
from app.models.enums import ExportFormat


def serialize_document_export(document: Document, extracted_data: ExtractedData, latest_job: Job | None) -> dict:
    return {
        "document": {
            "id": str(document.id),
            "filename": document.filename,
            "file_path": document.file_path,
            "status": document.status,
            "created_at": document.created_at.isoformat(),
            "updated_at": document.updated_at.isoformat(),
        },
        "job": None
        if latest_job is None
        else {
            "id": str(latest_job.id),
            "status": latest_job.status,
            "progress": latest_job.progress,
            "attempt_number": latest_job.attempt_number,
            "error_message": latest_job.error_message,
        },
        "extracted_data": {
            "id": str(extracted_data.id),
            "document_id": str(extracted_data.document_id),
            "title": extracted_data.title,
            "category": extracted_data.category,
            "summary": extracted_data.summary,
            "keywords": list(extracted_data.keywords),
            "finalized": extracted_data.finalized,
        },
    }


def render_export(
    *,
    export_format: ExportFormat,
    document: Document,
    extracted_data: ExtractedData,
    latest_job: Job | None,
) -> tuple[bytes, str]:
    payload = serialize_document_export(document, extracted_data, latest_job)

    if export_format == ExportFormat.JSON:
        return json.dumps(payload, indent=2).encode("utf-8"), "application/json"

    buffer = io.StringIO()
    writer = csv.DictWriter(
        buffer,
        fieldnames=[
            "document_id",
            "filename",
            "document_status",
            "job_id",
            "job_status",
            "job_progress",
            "title",
            "category",
            "summary",
            "keywords",
            "finalized",
        ],
    )
    writer.writeheader()
    writer.writerow(
        {
            "document_id": document.id,
            "filename": document.filename,
            "document_status": document.status,
            "job_id": latest_job.id if latest_job else "",
            "job_status": latest_job.status if latest_job else "",
            "job_progress": latest_job.progress if latest_job else "",
            "title": extracted_data.title,
            "category": extracted_data.category,
            "summary": extracted_data.summary,
            "keywords": ", ".join(_stringify_keywords(extracted_data.keywords)),
            "finalized": extracted_data.finalized,
        }
    )
    return buffer.getvalue().encode("utf-8"), "text/csv"


def _stringify_keywords(raw_keywords: object) -> Iterable[str]:
    if isinstance(raw_keywords, list):
        return [str(item) for item in raw_keywords]
    if isinstance(raw_keywords, dict):
        return [f"{key}:{value}" for key, value in raw_keywords.items()]
    return [str(raw_keywords)]
