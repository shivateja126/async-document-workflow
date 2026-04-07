from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Annotated

from pydantic import Field, computed_field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_name: str = "Async Document Processing Workflow System"
    environment: str = "development"
    app_port: int = 8000
    debug: bool = False
    log_level: str = "INFO"
    api_prefix: str = ""

    database_url: str = "postgresql+asyncpg://workflow_user:workflow_password@postgres:5432/document_workflow"
    redis_url: str = "redis://redis:6379/0"

    allowed_origins: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["http://localhost:3000"]
    )
    storage_root: Path = Path("./storage")
    upload_max_size_mb: int = 25
    allowed_file_extensions: Annotated[list[str], NoDecode] = Field(
        default_factory=lambda: ["pdf", "txt", "doc", "docx", "md", "png", "jpg", "jpeg"]
    )
    websocket_ping_interval_seconds: int = 15
    progress_channel_prefix: str = "job-progress"

    db_pool_size: int = 10
    db_max_overflow: int = 20

    celery_concurrency: int = 2
    celery_soft_time_limit_seconds: int = 300
    celery_time_limit_seconds: int = 360

    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [origin.strip() for origin in value.split(",") if origin.strip()]
        return value

    @field_validator("database_url", mode="before")
    @classmethod
    def normalize_database_url(cls, value: str) -> str:
        if value.startswith("postgres://"):
            return value.replace("postgres://", "postgresql+asyncpg://", 1)
        if value.startswith("postgresql://") and not value.startswith("postgresql+asyncpg://"):
            return value.replace("postgresql://", "postgresql+asyncpg://", 1)
        return value

    @field_validator("allowed_file_extensions", mode="before")
    @classmethod
    def parse_extensions(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return [item.strip().lstrip(".").lower() for item in value.split(",") if item.strip()]
        return [item.lstrip(".").lower() for item in value]

    @computed_field  # type: ignore[prop-decorator]
    @property
    def upload_max_size_bytes(self) -> int:
        return self.upload_max_size_mb * 1024 * 1024


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    settings.storage_root.mkdir(parents=True, exist_ok=True)
    return settings
