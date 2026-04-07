from __future__ import annotations

import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.extracted_data import ExtractedData


class ExtractedDataRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get_by_document_id(self, document_id: uuid.UUID) -> ExtractedData | None:
        result = await self.session.execute(
            select(ExtractedData).where(ExtractedData.document_id == document_id)
        )
        return result.scalar_one_or_none()

    async def upsert(
        self,
        *,
        document_id: uuid.UUID,
        title: str,
        category: str,
        summary: str,
        keywords: list[str],
        finalized: bool = False,
    ) -> ExtractedData:
        extracted_data = await self.get_by_document_id(document_id)
        if extracted_data is None:
            extracted_data = ExtractedData(
                document_id=document_id,
                title=title,
                category=category,
                summary=summary,
                keywords=keywords,
                finalized=finalized,
            )
            self.session.add(extracted_data)
        else:
            extracted_data.title = title
            extracted_data.category = category
            extracted_data.summary = summary
            extracted_data.keywords = keywords
            extracted_data.finalized = finalized
        await self.session.flush()
        return extracted_data

    async def apply_review(
        self,
        extracted_data: ExtractedData,
        *,
        title: str | None,
        category: str | None,
        summary: str | None,
        keywords: list[str] | None,
    ) -> ExtractedData:
        if title is not None:
            extracted_data.title = title
        if category is not None:
            extracted_data.category = category
        if summary is not None:
            extracted_data.summary = summary
        if keywords is not None:
            extracted_data.keywords = keywords
        await self.session.flush()
        return extracted_data

    async def finalize(self, extracted_data: ExtractedData) -> ExtractedData:
        extracted_data.finalized = True
        await self.session.flush()
        return extracted_data
