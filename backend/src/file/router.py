from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    File as FastAPIFile,
)
from fastapi.responses import FileResponse
from src.db.main import get_session
from sqlmodel.ext.asyncio.session import AsyncSession
from .dependency import validate_file
from src.auth.dependency import AccessTokenBearerAdmin
import os
import aiofiles
import mimetypes
from src.file.model import File, FileStatus
from sqlmodel import select
from src.shared.schema import FileSchemaWithAdmin
from typing import List
import uuid
from src.file.background_tasks import create_background_upload_task
from src.websocket.manager import manager

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
    """
    Upload files asynchronously. Files are processed in background tasks.
    Returns immediately with file IDs for tracking progress.
    """
    try:
        user_id = str(admin_detail["data"]["id"])
        upload_tasks = []

        for file in files:
            # Read file content
            file_content = await file.read()

            # Create background task for processing
            file_id = await create_background_upload_task(
                file_content=file_content,
                original_filename=file.filename,
                user_id=user_id,
                session=session,
            )

            upload_tasks.append(
                {
                    "file_id": file_id,
                    "filename": file.filename,
                    "status": "uploading",
                    "message": "File upload started",
                }
            )

            # Send initial notification
            await manager.send_upload_notification(
                user_id=user_id,
                file_id=file_id,
                status="uploading",
                filename=file.filename,
                progress=0,
            )

        return {
            "message": "Files upload started",
            "files": upload_tasks,
            "total_files": len(upload_tasks),
        }

    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@file_router.get("/upload/status/{file_id}")
async def get_upload_status(
    file_id: uuid.UUID,
    session: AsyncSession = Depends(get_session),
    admin_detail: dict = Depends(AccessTokenBearerAdmin),
):
    """Get upload status and progress for a specific file."""
    statement = select(File).where(File.id == file_id)
    result = await session.exec(statement)
    file_record = result.first()

    if not file_record:
        raise HTTPException(status_code=404, detail="File not found")

    # Check if user has permission to view this file
    if file_record.uploaded_by != admin_detail["data"]["id"]:
        raise HTTPException(status_code=403, detail="Access denied")

    return {
        "file_id": str(file_record.id),
        "filename": file_record.name,
        "status": file_record.status,
        "progress": file_record.upload_progress,
        "file_size": file_record.file_size,
        "error_message": file_record.error_message,
        "created_at": file_record.created_at,
        "updated_at": file_record.updated_at,
    }


@file_router.get("/", response_model=List[FileSchemaWithAdmin])
async def list_files(session: AsyncSession = Depends(get_session)):
    """List all uploaded files."""

    statement = select(File).order_by(File.name)

    files = await session.exec(statement)
    files_all = files.all()
    print(f"Files in database: {files_all}")
    if files_all:
        print(files_all[0].admin)
    return files_all


@file_router.get("/{file_id}")
async def download_file(
    file_id: uuid.UUID, session: AsyncSession = Depends(get_session)
):
    """Download a file by its ID."""

    statement = select(File).where(File.id == file_id)
    file_metadata = await session.exec(statement)
    file_metadata = file_metadata.first()
    if not file_metadata or not os.path.exists(file_metadata.link):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=file_metadata.link,
        filename=os.path.basename(file_metadata.link),
        media_type=file_metadata.type,
    )
