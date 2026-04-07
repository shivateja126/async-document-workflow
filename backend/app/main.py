from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import engine
from app.core.exceptions import register_exception_handlers
from app.core.logging import RequestContextMiddleware, configure_logging
from app.core.redis import get_redis_client


settings = get_settings()


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging(settings.log_level)
    yield
    await engine.dispose()
    await get_redis_client().aclose()


app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    version="1.0.0",
    lifespan=lifespan,
)

# ✅ FIXED CORS (this is the only important change)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 🔥 allows Vercel frontend to talk to Render backend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(RequestContextMiddleware)

register_exception_handlers(app)

app.include_router(api_router)