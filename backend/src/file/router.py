from hashlib import sha256
from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    UploadFile,
    BackgroundTasks,
    WebSocket,
    WebSocketDisconnect,
    Query,
    Form,
)
from concurrent.futures import ProcessPoolExecutor, ThreadPoolExecutor
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
from typing import List, Optional
import uuid
from src.file.service import process_files, FileInfoList
from src.config import Config
import json
from src.file.manager import WebSocketManager

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit
UPLOAD_DIR = os.path.expanduser("./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)  # Create directory if it doesn't exist


file_router = APIRouter()
websocket_manager = WebSocketManager()


@file_router.websocket("/ws/processing")
async def websocket_endpoint(websocket: WebSocket, admin_id: str = Query(None)):
    # print("WebSocket client trying to connect...")
    await websocket_manager.connect(websocket, admin_id)
    # print("WebSocket client connected.")
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket, admin_id)


async def process_files_in_background(
    files_info_list: FileInfoList, 
    admin_id: str, 
    database_url: str, 
    upload_id: str,
    retrain_file_ids: Optional[List[Optional[str]]] = None
):
    """
    Hàm chạy trong background để xử lý files mà không làm nghẽn API
    Supports both new file uploads and retraining existing files
    
    Args:
        retrain_file_ids: Array of file IDs (strings) where each index corresponds to files array.
                         If None at an index, treat as new file. If UUID string, retrain that file.
    """
    import time

    try:
        print(f"Starting background processing for {len(files_info_list)} files...")
        if retrain_file_ids:
            retrain_count = sum(1 for fid in retrain_file_ids if fid is not None)
            print(f"Retraining {retrain_count} existing files...")
        start_time = time.time()

        # Sử dụng ProcessPoolExecutor trong background task
        # with ProcessPoolExecutor() as executor:
        with ThreadPoolExecutor() as executor:
            loop = asyncio.get_event_loop()

            # Chạy process_files trong executor with retrain file IDs
            result = await loop.run_in_executor(
                executor, process_files, files_info_list, admin_id, database_url, retrain_file_ids
            )

        serialized_result = [
            {
                "filename": item["filename"],
                "status": item["status"],
                "file_id": str(item["file_id"]) if "file_id" in item else None,
                "is_retrain": item.get("is_retrain", False),
                "original_file_id": str(item["original_file_id"]) if "original_file_id" in item else None,
            }
            for item in result
            if item["status"]
        ]

        end_time = time.time()
        duration = end_time - start_time

        print(f"Background file processing completed in {duration:.2f} seconds")
        print(f"Processing result: {serialized_result}")

        # Broadcast processing result via WebSocket
        # status_list = [item["status"] for item in result]
        await websocket_manager.broadcast(
            admin_id,
            {
                "event": "processing_complete",
                "data": serialized_result,
                "uploadId": upload_id,
            },
        )

        return result

    except Exception as e:
        print(f"Error in background file processing: {str(e)}")
        # Broadcast error via WebSocket
        await websocket_manager.broadcast(
            admin_id,
            {"event": "processing_error", "error": str(e), "uploadId": upload_id},
        )
        return {"error": str(e)}


@file_router.post("/upload", status_code=status.HTTP_202_ACCEPTED)
async def upload_files(
    background_tasks: BackgroundTasks,
    files: List[UploadFile] = Depends(validate_file),
    admin_detail: dict = Depends(AccessTokenBearerAdmin),
    retrain_file_ids: Optional[str] = Form(None),  # JSON string array of file IDs
    session: AsyncSession = Depends(get_session),
):
    # Parse retrain_file_ids if provided
    retrain_ids_array = None
    if retrain_file_ids:
        try:
            retrain_ids_array = json.loads(retrain_file_ids)
            
            # Validate array length matches files length
            if len(retrain_ids_array) != len(files):
                raise HTTPException(
                    status_code=400,
                    detail=f"retrain_file_ids array length ({len(retrain_ids_array)}) must match files array length ({len(files)})"
                )
            
            # Extract non-null file IDs for validation
            file_ids_to_validate = [fid for fid in retrain_ids_array if fid is not None]
            
            if file_ids_to_validate:
                # Convert string UUIDs to UUID objects for validation
                try:
                    uuid_objects = [uuid.UUID(fid) for fid in file_ids_to_validate]
                except ValueError as e:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid UUID format in retrain_file_ids: {str(e)}"
                    )
                
                # Validate that all specified file IDs exist and belong to the admin
                statement = select(File).where(
                    File.id.in_(uuid_objects),
                    File.deleted == False,
                    File.uploaded_by == admin_detail["data"]["id"]
                )
                existing_files = await session.exec(statement)
                existing_file_ids = {str(file.id) for file in existing_files.all()}
                
                # Check if all requested file IDs exist
                missing_ids = set(file_ids_to_validate) - existing_file_ids
                if missing_ids:
                    raise HTTPException(
                        status_code=404,
                        detail=f"Files not found or access denied: {missing_ids}"
                    )
                
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=400,
                detail="Invalid JSON format for retrain_file_ids parameter"
            )
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(
                status_code=400,
                detail=f"Error processing retrain_file_ids: {str(e)}"
            )

    async def get_file_info(file: UploadFile, index: int):
        # Sanitize and construct file path
        relative_path = file.filename  # Maintain original folder structure
        safe_filepath = os.path.normpath(relative_path).replace("..", "").lstrip("/")
        full_path = os.path.join(UPLOAD_DIR, safe_filepath)
        # only get the filename, not the full path
        safe_filename = os.path.basename(safe_filepath)

        content = await file.read()
        hash = sha256(content).hexdigest()
        media_type = (
            mimetypes.guess_type(file.filename)[0] or "application/octet-stream"
        )
        extension = os.path.splitext(file.filename)[1].lower()

        # Check if this file is for retraining based on index
        retrain_file_id = None
        if retrain_ids_array and index < len(retrain_ids_array):
            retrain_file_id = retrain_ids_array[index]

        return {
            "filename": safe_filename,
            "full_path": full_path,
            "extension": extension,
            "content": content,
            "media_type": media_type,
            "hash": hash,
            "upload_index": index,
            "retrain_file_id": retrain_file_id,
        }

    get_file_info_tasks = [get_file_info(file, i) for i, file in enumerate(files)]
    files_info_list = await asyncio.gather(*get_file_info_tasks)

    admin_id = admin_detail["data"]["id"]
    upload_id = str(uuid.uuid4())
    # Thêm task vào background tasks để xử lý bất đồng bộ
    background_tasks.add_task(
        process_files_in_background,
        files_info_list,
        admin_id,
        Config.DATABASE_URL,
        upload_id,
        retrain_ids_array,
    )

    response_message = "Files are being processed in the background. You will be notified upon completion."
    if retrain_ids_array:
        retrain_count = sum(1 for fid in retrain_ids_array if fid is not None)
        response_message += f" {retrain_count} files will be retrained."

    return {
        "message": response_message,
        "files": [{"filename": file.filename, "upload_index": i} for i, file in enumerate(files)],
        "uploadID": upload_id,
        "retrain_count": sum(1 for fid in retrain_ids_array if fid is not None) if retrain_ids_array else 0,
    }


@file_router.get("/", response_model=List[FileSchemaWithAdmin])
async def list_files(
    session: AsyncSession = Depends(get_session),
    admin_detail: dict = Depends(AccessTokenBearerAdmin),
):
    """List all uploaded files."""

    statement = select(File).where(File.deleted == False).order_by(File.name)

    files = await session.exec(statement)
    files_all = files.all()
    print(f"Files in database: {files_all}")
    print(files_all[0].admin if files_all else "No files found")
    return files_all


@file_router.get("/{file_id}")
async def download_file(
    file_id: uuid.UUID, session: AsyncSession = Depends(get_session),
    admin_detail: dict = Depends(AccessTokenBearerAdmin),
):
    """Download a file by its ID."""

    statement = select(File).where(File.id == file_id and File.deleted == False)
    file_metadata = await session.exec(statement)
    file_metadata = file_metadata.first()
    if not file_metadata or not os.path.exists(file_metadata.link):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(
        path=file_metadata.link,
        filename=file_metadata.name,
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
