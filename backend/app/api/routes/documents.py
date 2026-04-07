from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, File, Query, UploadFile
from fastapi.responses import Response

from app.api.dependencies import get_document_service
from app.models.enums import ExportFormat
from app.schemas.common import PaginatedResponse
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
from app.schemas.extracted_data import ExtractedDataReviewRequest
from app.services.document_service import DocumentService


router = APIRouter()


@router.post("/documents/upload", response_model=DocumentUploadResponse, status_code=202)
async def upload_document(
    file: UploadFile = File(...),
    document_service: DocumentService = Depends(get_document_service),
) -> DocumentUploadResponse:
    return await document_service.upload_document(file)


@router.post("/documents/upload-batch", response_model=DocumentBatchUploadResponse, status_code=202)
async def upload_documents(
    files: list[UploadFile] = File(...),
    document_service: DocumentService = Depends(get_document_service),
) -> DocumentBatchUploadResponse:
    return await document_service.upload_documents(files)


@router.get("/documents", response_model=PaginatedResponse[DocumentRead])
async def list_documents(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=10, ge=1, le=100),
    search: str | None = Query(default=None),
    status: str | None = Query(default=None),
    sort_by: str = Query(default="updated_at"),
    sort_order: str = Query(default="desc"),
    document_service: DocumentService = Depends(get_document_service),
) -> PaginatedResponse[DocumentRead]:
    query = DocumentListQuery(
        page=page,
        page_size=page_size,
        search=search,
        status=status,
        sort_by=sort_by,
        sort_order=sort_order,
    )
    return await document_service.list_documents(query)


@router.get("/documents/{document_id}", response_model=DocumentDetailRead)
async def get_document(
    document_id: uuid.UUID,
    document_service: DocumentService = Depends(get_document_service),
) -> DocumentDetailRead:
    return await document_service.get_document(document_id)


@router.delete("/documents/{document_id}", response_model=DocumentDeleteResponse)
async def delete_document(
    document_id: uuid.UUID,
    document_service: DocumentService = Depends(get_document_service),
) -> DocumentDeleteResponse:
    return await document_service.delete_document(document_id)


@router.patch("/documents/{document_id}/review", response_model=DocumentDetailRead)
async def review_document(
    document_id: uuid.UUID,
    payload: ExtractedDataReviewRequest,
    document_service: DocumentService = Depends(get_document_service),
) -> DocumentDetailRead:
    return await document_service.review_document(document_id, payload)


@router.post("/documents/{document_id}/finalize", response_model=DocumentFinalizeResponse)
async def finalize_document(
    document_id: uuid.UUID,
    document_service: DocumentService = Depends(get_document_service),
) -> DocumentFinalizeResponse:
    return await document_service.finalize_document(document_id)


@router.get("/documents/{document_id}/export")
async def export_document(
    document_id: uuid.UUID,
    format: ExportFormat = Query(default=ExportFormat.JSON),
    document_service: DocumentService = Depends(get_document_service),
) -> Response:
    payload, media_type, export_name = await document_service.export_document(
        document_id=document_id,
        query=DocumentExportQuery(format=format),
    )
    headers = {"Content-Disposition": f'attachment; filename="{export_name}"'}
    return Response(content=payload, media_type=media_type, headers=headers)
