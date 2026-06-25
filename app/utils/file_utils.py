import os
import uuid
from pathlib import Path
from fastapi import UploadFile


ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}


def validate_file(file: UploadFile) -> str:
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type '{ext}'. Allowed: {', '.join(ALLOWED_EXTENSIONS)}")
    return ext


async def save_upload(file: UploadFile, upload_dir: str) -> Path:
    ext = validate_file(file)
    unique_name = f"{uuid.uuid4().hex}{ext}"
    filepath = Path(upload_dir) / unique_name
    content = await file.read()
    filepath.write_bytes(content)
    return filepath


def cleanup_file(filepath: Path) -> None:
    if filepath.exists():
        os.remove(filepath)
