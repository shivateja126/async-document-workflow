from fastapi import APIRouter

from app.api.routes.documents import router as documents_router
from app.api.routes.health import router as health_router
from app.api.routes.jobs import router as jobs_router
from app.api.routes.ws import router as ws_router


api_router = APIRouter()
api_router.include_router(documents_router, tags=["documents"])
api_router.include_router(jobs_router, tags=["jobs"])
api_router.include_router(health_router, tags=["health"])
api_router.include_router(ws_router, tags=["progress"])
