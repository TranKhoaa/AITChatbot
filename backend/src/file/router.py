from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from src.db.main import get_session
from sqlmodel.ext.asyncio.session import AsyncSession
from .dependency import validate_file
from src.auth.dependency import AccessTokenBearerAdmin
import os
import aiofiles
import mimetypes
from src.file.model import File
from typing import List

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit
UPLOAD_DIR = os.path.expanduser("./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)  # Create directory if it doesn't exist


file_router = APIRouter()


@file_router.post("/upload")
async def upload_files(
    files: List[UploadFile] = Depends(validate_file),
    admin_detail: dict = Depends(AccessTokenBearerAdmin),
    session: AsyncSession = Depends(get_session),
):
    try:
        uploaded_files = []
        for file in files:
            # Sanitize and construct file path
            relative_path = file.filename  # Maintain original folder structure
            safe_filename = (
                os.path.normpath(relative_path).replace("..", "").lstrip("/")
            )
            full_path = os.path.join(UPLOAD_DIR, safe_filename)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)

            # Save file
            async with aiofiles.open(full_path, "wb") as out_file:
                content = await file.read()
                if len(content) > MAX_FILE_SIZE:
                    raise HTTPException(status_code=400, detail="File too large")
                await out_file.write(content)

            # Save metadata
            content_type = (
                mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
            )
            # get extension
            filecontent_type = os.path.splitext(file.filename)[1].lower()
            print(f"File metadata: {filecontent_type}")

            file_metadata = File(
                name=file.filename,
                link="",
                type=filecontent_type,
                uploaded_by=admin_detail["data"]["id"],
                chunks=[],
            )
            print(f"File metadata: {file_metadata}")
            session.add(file_metadata)
            uploaded_files.append({"filename": file.filename, "status": "success"})

        await session.commit()
        return {"files": uploaded_files}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
