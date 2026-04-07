from __future__ import annotations

import uuid
from dataclasses import dataclass
from pathlib import Path

import aiofiles
from fastapi import UploadFile


@dataclass(slots=True)
class StoredFile:
    relative_path: str
    size_bytes: int
    content_type: str | None


class LocalFileStorage:
    def __init__(self, root: Path) -> None:
        self.root = root
        self.root.mkdir(parents=True, exist_ok=True)

    async def save_upload(self, upload: UploadFile) -> StoredFile:
        safe_name = _safe_filename(upload.filename or "document.bin")
        relative_path = f"documents/{uuid.uuid4()}-{safe_name}"
        absolute_path = self.root / relative_path
        absolute_path.parent.mkdir(parents=True, exist_ok=True)

        file_size = 0
        async with aiofiles.open(absolute_path, "wb") as destination:
            while chunk := await upload.read(1024 * 1024):
                file_size += len(chunk)
                await destination.write(chunk)

        await upload.close()
        return StoredFile(
            relative_path=relative_path,
            size_bytes=file_size,
            content_type=upload.content_type,
        )

    def delete(self, relative_path: str) -> None:
        file_path = self.root / relative_path
        if file_path.exists():
            file_path.unlink()


def _safe_filename(filename: str) -> str:
    return "".join(character if character.isalnum() or character in {".", "-", "_"} else "-" for character in filename).strip("-") or "document.bin"
