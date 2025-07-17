from fastapi import UploadFile, HTTPException
from typing import List
import os

ALLOWED_EXTENSIONS = {".txt", ".pdf", ".jpg", ".jpeg", ".png", ".docx", ".xlsx"}


def validate_file(files: List[UploadFile]) -> List[UploadFile]:
    """Validate file extension and size."""
    for file in files:
        ext = os.path.splitext(file.filename)[1].lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400, detail=f"File extension {ext} not allowed"
            )
    return files
