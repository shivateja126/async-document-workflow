from __future__ import annotations

import json
from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import uuid4

from app.models.enums import ExportFormat
from app.utils.exporters import render_export


def make_document() -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        filename="contract.pdf",
        file_path="documents/contract.pdf",
        status="completed",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )


def make_extracted_data(document_id) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        document_id=document_id,
        title="Contract",
        category="Contract",
        summary="A simulated summary.",
        keywords=["pdf", "contract", "simulated"],
        finalized=True,
    )


def make_job(document_id) -> SimpleNamespace:
    return SimpleNamespace(
        id=uuid4(),
        document_id=document_id,
        status="completed",
        progress=100,
        attempt_number=1,
        error_message=None,
    )


def test_render_export_json() -> None:
    document = make_document()
    extracted_data = make_extracted_data(document.id)
    job = make_job(document.id)

    content, media_type = render_export(
        export_format=ExportFormat.JSON,
        document=document,
        extracted_data=extracted_data,
        latest_job=job,
    )

    payload = json.loads(content.decode("utf-8"))
    assert media_type == "application/json"
    assert payload["document"]["filename"] == "contract.pdf"
    assert payload["extracted_data"]["title"] == "Contract"


def test_render_export_csv() -> None:
    document = make_document()
    extracted_data = make_extracted_data(document.id)
    job = make_job(document.id)

    content, media_type = render_export(
        export_format=ExportFormat.CSV,
        document=document,
        extracted_data=extracted_data,
        latest_job=job,
    )

    decoded = content.decode("utf-8")
    assert media_type == "text/csv"
    assert "document_id" in decoded
    assert "contract.pdf" in decoded
