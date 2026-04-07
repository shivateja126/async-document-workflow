from __future__ import annotations

import uuid

from sqlalchemy import Select, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.document import Document
from app.schemas.document import DocumentListQuery
from app.schemas.common import SortOrder


class DocumentRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create(
        self,
        *,
        filename: str,
        file_path: str,
        content_type: str | None,
        size_bytes: int,
        status: str,
    ) -> Document:
        document = Document(
            filename=filename,
            file_path=file_path,
            content_type=content_type,
            size_bytes=size_bytes,
            status=status,
        )
        self.session.add(document)
        await self.session.flush()
        return document

    async def get_by_id(self, document_id: uuid.UUID) -> Document | None:
        statement = (
            select(Document)
            .where(Document.id == document_id)
            .options(
                selectinload(Document.jobs),
                selectinload(Document.extracted_data),
            )
        )
        result = await self.session.execute(statement)
        return result.scalar_one_or_none()

    async def delete(self, document: Document) -> None:
        await self.session.delete(document)
        await self.session.flush()

    async def list(self, query: DocumentListQuery) -> tuple[list[Document], int]:
        statement: Select[tuple[Document]] = select(Document).options(
            selectinload(Document.jobs),
            selectinload(Document.extracted_data),
        )
        count_statement = select(func.count(Document.id))

        if query.search:
            search_term = f"%{query.search.lower()}%"
            filter_clause = or_(
                func.lower(Document.filename).like(search_term),
                func.lower(Document.file_path).like(search_term),
            )
            statement = statement.where(filter_clause)
            count_statement = count_statement.where(filter_clause)

        if query.status:
            statement = statement.where(Document.status == query.status.value)
            count_statement = count_statement.where(Document.status == query.status.value)

        sort_column = getattr(Document, query.sort_by.value)
        statement = statement.order_by(
            sort_column.asc() if query.sort_order == SortOrder.ASC else sort_column.desc()
        )
        statement = statement.offset(query.offset).limit(query.page_size)

        total_items = await self.session.scalar(count_statement)
        result = await self.session.execute(statement)
        return list(result.scalars().unique().all()), int(total_items or 0)
