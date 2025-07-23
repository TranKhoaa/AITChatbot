from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from fastapi.responses import FileResponse
from src.db.main import get_session
from sqlmodel.ext.asyncio.session import AsyncSession
from .dependency import validate_file
from src.auth.dependency import AccessTokenBearerAdmin
import os
import aiofiles
import mimetypes
from src.file.model import File
from src.chunk.model import Chunk
from datetime import datetime
from sqlmodel import select
from src.shared.schema import FileSchemaWithAdmin
from typing import List
import uuid
from src.file.utils import (
    read_docx_file,
    read_pdf_file,
    chunk_text, 
    vector_embedding_chunks,
    read_excel_file,
    )

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
                link=full_path,
                type=filecontent_type,
                uploaded_by=admin_detail["data"]["id"],
                chunks=[],
            )
            print(f"File metadata: {file_metadata}")
            session.add(file_metadata)
            # uploaded_files.append({"filename": file.filename, "status": "success"})
            await session.flush()  # ensures file_metadata.id is available

            # Automatically embed if .docx
            if filecontent_type == ".docx":
                try:    
                    text = read_docx_file(full_path)
                    chunks = chunk_text(text)
                    if not chunks:
                        raise HTTPException(status_code=400, detail=f"No valid chunks extracted from {file.filename}")
                    embeddings = vector_embedding_chunks(chunks)
                    if len(chunks) != len(embeddings):
                        raise HTTPException(status_code=500, detail=f"Mismatch between chunks and embeddings for {file.filename}")
                    for chunk_content, embedding in zip(chunks, embeddings):
                        chunk = Chunk(
                            content=chunk_content,
                            vector=embedding.tolist(),
                            file_id=file_metadata.id,
                            created_at=datetime.now(),
                            updated_at=datetime.now(),
                        )
                        session.add(chunk)
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to embed {file.filename}: {str(e)}")
            elif filecontent_type == ".pdf":
                try:    
                    text = read_pdf_file(full_path)
                    chunks = chunk_text(text)
                    if not chunks:
                        raise HTTPException(status_code=400, detail=f"No valid chunks extracted from {file.filename}")
                    embeddings = vector_embedding_chunks(chunks)
                    if len(chunks) != len(embeddings):
                        raise HTTPException(status_code=500, detail=f"Mismatch between chunks and embeddings for {file.filename}")
                    for chunk_content, embedding in zip(chunks, embeddings):
                        chunk = Chunk(
                            content=chunk_content,
                            vector=embedding.tolist(),
                            file_id=file_metadata.id,
                            created_at=datetime.now(),
                            updated_at=datetime.now(),
                        )
                        session.add(chunk)
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to embed {file.filename}: {str(e)}")
            elif filecontent_type == ".xlsx":
                try:
                    rows = read_excel_file(full_path)  # List of JSON strings, each row
                    if not rows:
                        raise HTTPException(status_code=400, detail=f"No valid rows extracted from {file.filename}")
                    embeddings = vector_embedding_chunks(rows)
                    if len(rows) != len(embeddings):
                        raise HTTPException(status_code=500, detail=f"Mismatch between rows and embeddings for {file.filename}")
                    for row_content, embedding in zip(rows, embeddings):
                        chunk = Chunk(
                            content=row_content,
                            vector=embedding.tolist(),
                            file_id=file_metadata.id,
                            created_at=datetime.now(),
                            updated_at=datetime.now(),
                        )
                        session.add(chunk)
                except Exception as e:
                    raise HTTPException(status_code=500, detail=f"Failed to embed {file.filename}: {str(e)}")    
            else:
                raise HTTPException(status_code=500, detail=f"File type is not supported {filecontent_type}")

            uploaded_files.append({"filename": file.filename, "status": "uploaded and embedded"})

        await session.commit()
        return {"files": uploaded_files}
        await session.commit()
        return {"files": uploaded_files}
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@file_router.get("/", response_model=List[FileSchemaWithAdmin])
async def list_files(session: AsyncSession = Depends(get_session)):
    """List all uploaded files."""

    statement = select(File).order_by(File.name)

    files = await session.exec(statement)
    files_all = files.all()
    print(f"Files in database: {files_all}")
    print(files_all[0].admin if files_all else "No files found")
    return files_all


@file_router.get("/{file_id}")
async def download_file(file_id: uuid.UUID, session: AsyncSession = Depends(get_session)):
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