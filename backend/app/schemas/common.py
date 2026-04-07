from __future__ import annotations

from enum import StrEnum
from math import ceil
from typing import Generic, TypeVar

from pydantic import BaseModel, Field


SchemaT = TypeVar("SchemaT")


class SortOrder(StrEnum):
    ASC = "asc"
    DESC = "desc"


class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=10, ge=1, le=100)

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.page_size


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int

    @classmethod
    def from_counts(cls, page: int, page_size: int, total_items: int) -> "PaginationMeta":
        return cls(
            page=page,
            page_size=page_size,
            total_items=total_items,
            total_pages=max(1, ceil(total_items / page_size)) if total_items else 1,
        )


class PaginatedResponse(BaseModel, Generic[SchemaT]):
    items: list[SchemaT]
    meta: PaginationMeta
