from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    BackgroundTasks,
)
from concurrent.futures import ProcessPoolExecutor
from fastapi.responses import FileResponse
from src.db.main import get_session
from sqlmodel.ext.asyncio.session import AsyncSession
from .dependency import validate_file
from src.auth.dependency import AccessTokenBearerAdmin
import os
import asyncio
import mimetypes
from src.file.model import File
from sqlmodel import select
from src.shared.schema import FileSchemaWithAdmin
from typing import List
import uuid
from src.file.service import process_files, FileInfoList
from src.config import Config

# from src.file.utils import (
#     read_docx_file,
#     read_pdf_file,
#     chunk_text,
#     vector_embedding_chunks,
#     read_excel_file,
# )


MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit
UPLOAD_DIR = os.path.expanduser("./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)  # Create directory if it doesn't exist


file_router = APIRouter()


async def process_files_in_background(
    files_info_list: FileInfoList, admin_id: str, database_url: str
):
    """
    Hàm chạy trong background để xử lý files mà không làm nghẽn API
    """
    import time

    try:
        print(f"Starting background processing for {len(files_info_list)} files...")
        start_time = time.time()

        # Sử dụng ProcessPoolExecutor trong background task
        with ProcessPoolExecutor() as executor:
            loop = asyncio.get_event_loop()

            # Chạy process_files trong executor
            result = await loop.run_in_executor(
                executor, process_files, files_info_list, admin_id, database_url
            )

        end_time = time.time()
        duration = end_time - start_time

        print(f"Background file processing completed in {duration:.2f} seconds")
        print(f"Processing result: {result}")

        # Ở đây bạn có thể thêm logic để gửi thông báo WebSocket
        # hoặc update database về trạng thái xử lý

        return result

    except Exception as e:
        print(f"Error in background file processing: {str(e)}")
        # Có thể log error hoặc gửi thông báo lỗi qua WebSocket
        return {"error": str(e)}


@file_router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = Depends(validate_file),
    admin_detail: dict = Depends(AccessTokenBearerAdmin),
):
    async def get_file_info(file: UploadFile):
        # Sanitize and construct file path
        relative_path = file.filename  # Maintain original folder structure
        safe_filepath = os.path.normpath(relative_path).replace("..", "").lstrip("/")
        full_path = os.path.join(UPLOAD_DIR, safe_filepath)
        # only get the filename, not the full path
        safe_filename = os.path.basename(safe_filepath)

        content = await file.read()
        media_type = (
            mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        )
        extension = os.path.splitext(file.filename)[1].lower()

        return {
            "filename": safe_filename,
            "full_path": full_path,
            "extension": extension,
            "content": content,
            "media_type": media_type,
        }

    get_file_info_tasks = [get_file_info(file) for file in files]
    files_info_list = await asyncio.gather(*get_file_info_tasks)

    admin_id = admin_detail["data"]["id"]

    # Thêm task vào background tasks để xử lý bất đồng bộ
    background_tasks.add_task(
        process_files_in_background, files_info_list, admin_id, Config.DATABASE_URL
    )

    return {
        "message": "Files are being processed in the background. You will be notified upon completion.",
        "files": [{"filename": file.filename} for file in files],
    }


@file_router.get("/", response_model=List[FileSchemaWithAdmin])
async def list_files(session: AsyncSession = Depends(get_session)):
    """List all uploaded files."""

    statement = select(File).where(File.deleted == False).order_by(File.name)

    files = await session.exec(statement)
    files_all = files.all()
    print(f"Files in database: {files_all}")
    print(files_all[0].admin if files_all else "No files found")
    return files_all


@file_router.get("/{file_id}")
async def download_file(
    file_id: uuid.UUID, session: AsyncSession = Depends(get_session)
):
    """Download a file by its ID."""

    statement = select(File).where(File.id == file_id and File.deleted == False)
    file_metadata = await session.exec(statement)
    file_metadata = file_metadata.first()
    if not file_metadata or not os.path.exists(file_metadata.link):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=file_metadata.link,
        filename=file_metadata.name,  # Use original filename instead of basename
        media_type=file_metadata.media_type,
    )


@file_router.delete("/{file_id}", status_code=status.HTTP_204_NO_CONTENT)
async def soft_delete_file(
    file_id: uuid.UUID,
    admin_detail: dict = Depends(AccessTokenBearerAdmin),
    session: AsyncSession = Depends(get_session),
):
    """Soft delete a file by its ID."""
    statement = select(File).where(File.id == file_id)
    file_metadata = await session.exec(statement)
    file_metadata = file_metadata.first()

    if not file_metadata:
        raise HTTPException(status_code=404, detail="File not found")

    # if file_metadata.uploaded_by != admin_detail["data"]["id"]:
    #     raise HTTPException(
    #         status_code=403, detail="You do not have permission to delete this file"
    #     )

    # Soft delete by setting deleted flag
    file_metadata.deleted = True
    session.add(file_metadata)
    await session.commit()

    return {"message": "File soft deleted successfully"}


# @file_router.post("/embed")
# async def embed_files(
#     file_ids: List[uuid.UUID],
#     admin_detail: dict = Depends(AccessTokenBearerAdmin),
#     session: AsyncSession = Depends(get_session),
# ):
#     """Chunk and embed selected .docx files, storing results in the database."""
#     try:
#         processed_files = []
#         for file_id in file_ids:
#             # Fetch file metadata
#             statement = select(File).where(File.id == file_id)
#             file_metadata = await session.exec(statement)
#             file_metadata = file_metadata.first()
#             if not file_metadata or not os.path.exists(file_metadata.link):
#                 raise HTTPException(status_code=404, detail=f"File {file_id} not found")

#             # Check if file is .docx
#             file_extension = file_metadata.type.lower()
#             if file_extension != ".docx":
#                 raise HTTPException(
#                     status_code=400,
#                     detail=f"Only .docx files are supported for embedding, got {file_extension}"
#                 )

#             # Extract text from .docx file
#             try:
#                 text = read_docx_file(file_metadata.link)
#             except Exception as e:
#                 raise HTTPException(
#                     status_code=400,
#                     detail=f"Failed to extract text from {file_metadata.name}: {str(e)}"
#                 )

#             # Chunk the text
#             chunks = chunk_text(text)
#             if not chunks:
#                 raise HTTPException(
#                     status_code=400,
#                     detail=f"No valid chunks extracted from {file_metadata.name}"
#                 )

#             # Generate embeddings
#             try:
#                 embeddings = vector_embedding_chunks(chunks)
#             except Exception as e:
#                 raise HTTPException(
#                     status_code=400,
#                     detail=f"Failed to generate embeddings for {file_metadata.name}: {str(e)}"
#                 )

#             # Ensure chunks and embeddings are aligned
#             if len(chunks) != len(embeddings):
#                 raise HTTPException(
#                     status_code=500,
#                     detail=f"Mismatch between chunks and embeddings for {file_metadata.name}"
#                 )

#             # Store chunks and embeddings
#             for chunk_content, embedding in zip(chunks, embeddings):
#                 chunk = Chunk(
#                     content=chunk_content,
#                     vector=embedding.tolist(),  # Convert NumPy array to list for storage
#                     file_id=file_metadata.id,
#                     created_at=datetime.now(),
#                     updated_at=datetime.now(),
#                 )
#                 session.add(chunk)

#             processed_files.append({"file_id": file_id, "status": "embedded", "chunk_count": len(chunks)})

#         await session.commit()
#         return {"files": processed_files}
#     except Exception as e:
#         await session.rollback()
#         raise HTTPException(status_code=500, detail=str(e))
