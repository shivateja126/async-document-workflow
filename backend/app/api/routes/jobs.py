from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends

from app.api.dependencies import get_job_service
from app.schemas.job import JobRead, RetryJobResponse
from app.services.job_service import JobService


router = APIRouter()


@router.get("/jobs/{job_id}", response_model=JobRead)
async def get_job(
    job_id: uuid.UUID,
    job_service: JobService = Depends(get_job_service),
) -> JobRead:
    return await job_service.get_job(job_id)


@router.post("/jobs/{job_id}/retry", response_model=RetryJobResponse, status_code=202)
async def retry_job(
    job_id: uuid.UUID,
    job_service: JobService = Depends(get_job_service),
) -> RetryJobResponse:
    return await job_service.retry_job(job_id)
