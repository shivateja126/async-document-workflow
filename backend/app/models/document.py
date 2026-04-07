from __future__ import annotations

from typing import TYPE_CHECKING

from sqlalchemy import BigInteger, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.models.enums import DocumentStatus
from app.models.job import Job

if TYPE_CHECKING:
    from app.models.extracted_data import ExtractedData
    from app.models.job import Job


class Document(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "documents"
    __table_args__ = (
        Index("ix_documents_status_created_at", "status", "created_at"),
        Index("ix_documents_filename", "filename"),
    )

    filename: Mapped[str] = mapped_column(String(255), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default=DocumentStatus.QUEUED.value)
    content_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    size_bytes: Mapped[int] = mapped_column(BigInteger, nullable=False, default=0)

    jobs: Mapped[list["Job"]] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        order_by=lambda: Job.created_at.desc(),
    )
    extracted_data: Mapped["ExtractedData | None"] = relationship(
        back_populates="document",
        cascade="all, delete-orphan",
        uselist=False,
    )
