from typing import List, TypedDict, Optional
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import create_engine, select
from sqlalchemy.ext.asyncio import AsyncEngine
from sqlalchemy.orm import sessionmaker
from src.file.model import File
import asyncio
import aiofiles
import os
import logging
from src.chunk.model import Chunk
from src.file.utils import (
    read_docx_file,
    read_pdf_file,
    read_excel_file,
    read_txt_file,
    chunk_text,
    vector_embedding_chunks,
)
import secrets
import uuid

logger = logging.getLogger(__name__)


class FileInfo(TypedDict):
    filename: str
    full_path: str
    extension: str
    content: bytes
    media_type: str
    hash: str
    upload_index: int
    retrain_file_id: Optional[str]  # UUID string of existing file to retrain, or None for new file


# Kiểu dữ liệu cho array của FileInfo
FileInfoList = List[FileInfo]


def process_files(
    files: FileInfoList,
    uploaded_by,
    DATABASE_URL: str,
    retrain_file_ids: Optional[List[Optional[str]]] = None,
):
    """
    Hàm chạy trong process riêng để xử lý files
    Trả về trạng thái để process chính gửi thông báo WebSocket
    Supports both new file uploads and retraining existing files
    
    Args:
        retrain_file_ids: Array of file ID strings where each index corresponds to files array.
                         If None at an index, treat as new file. If UUID string, retrain that file.
    """

    engine = AsyncEngine(create_engine(url=DATABASE_URL, echo=True))
    session_maker = sessionmaker(
        bind=engine, class_=AsyncSession, expire_on_commit=False
    )

    async def _process():
        async def _process_file(file: FileInfo):
            async with session_maker() as session:
                try:
                    filename = file["filename"]
                    full_path = file["full_path"]
                    extension = file["extension"]
                    media_type = file["media_type"]
                    hash = file["hash"]
                    content = file["content"]
                    retrain_file_id = file.get("retrain_file_id")

                    # Check if this is a retrain operation
                    if retrain_file_id:
                        return await _retrain_existing_file(
                            session, file, retrain_file_id, uploaded_by
                        )
                    else:
                        return await _process_new_file(
                            session, file, uploaded_by
                        )

                except Exception as e:
                    logger.error(f"Failed to process {filename}: {str(e)}")
                    await session.rollback()
                    if os.path.exists(full_path):
                        os.remove(full_path)

                    return {
                        "filename": filename,
                        "status": "failed",
                        "error": str(e),
                    }

        async def _retrain_existing_file(session, file: FileInfo, retrain_file_id: str, uploaded_by):
            """Handle retraining of an existing file"""
            filename = file["filename"]
            full_path = file["full_path"]
            extension = file["extension"]
            media_type = file["media_type"]
            hash = file["hash"]
            content = file["content"]
            
            # Get the existing file to retrain
            target_file_id = uuid.UUID(retrain_file_id)
            select_stmt = select(File).where(File.id == target_file_id)
            existing_file = await session.exec(select_stmt)
            existing_file = existing_file.first()
            
            if not existing_file:
                raise Exception(f"Target file for retraining not found: {target_file_id}")
            
            # Delete old chunks associated with this file
            delete_chunks_stmt = select(Chunk).where(Chunk.file_id == target_file_id)
            old_chunks = await session.exec(delete_chunks_stmt)
            for chunk in old_chunks:
                await session.delete(chunk)
            
            # Save the new file content (replace the old file)
            old_file_path = existing_file.link
            if os.path.exists(old_file_path):
                os.remove(old_file_path)  # Remove old physical file
            
            # Create new file path for the retrained file
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            async with aiofiles.open(full_path, "wb") as f:
                await f.write(content)
            
            # Update file metadata
            existing_file.name = filename
            existing_file.link = full_path
            existing_file.type = extension
            existing_file.media_type = media_type
            existing_file.hash = hash
            existing_file.uploaded_by = uploaded_by
            existing_file.deleted = False
            
            # Process and generate new chunks and embeddings
            chunks = await _extract_text_and_chunk(full_path, extension, filename)
            embeddings = vector_embedding_chunks(chunks)
            
            if len(chunks) != len(embeddings):
                raise Exception(f"Mismatch between chunks and embeddings for {filename}")
            
            # Add new chunks
            for chunk_content, embedding in zip(chunks, embeddings):
                chunk = Chunk(
                    content=chunk_content,
                    vector=embedding.tolist(),
                    file_id=existing_file.id,
                )
                session.add(chunk)
            
            await session.commit()
            
            return {
                "filename": filename,
                "status": "retrained",
                "file_id": existing_file.id,
                "is_retrain": True,
                "original_file_id": target_file_id,
            }

        async def _process_new_file(session, file: FileInfo, uploaded_by):
            """Handle processing of a new file (existing logic)"""
            filename = file["filename"]
            full_path = file["full_path"]
            extension = file["extension"]
            media_type = file["media_type"]
            hash = file["hash"]
            content = file["content"]

            # chech if file already exists
            select_stmt = select(File).where(File.hash == hash)
            existing_file = await session.exec(select_stmt)
            existing_file = existing_file.first()
            if existing_file:
                if existing_file.deleted:
                    # Restore deleted file
                    existing_file.deleted = False
                    existing_file.uploaded_by = uploaded_by
                    await session.commit()
                    return {
                        "filename": filename,
                        "status": "restored",
                        "file_id": existing_file.id,
                    }
                else:
                    # File already exists and is not deleted
                    return {
                        "filename": filename,
                        "status": "exists",
                        "file_id": existing_file.id,
                    }
                    
            # allow to upload file with existing name -> need to change full path to save 
            # if there is an existing file with the same name -> change full path
            select_stmt = select(File).where(File.name == filename)
            existing_file = await session.exec(select_stmt)
            existing_file = existing_file.first()
            if existing_file:
                # Generate random string-based unique filename
                base_path = full_path.rsplit(extension, 1)[0]  # Remove extension
                max_attempts = 10  # Prevent infinite loop in rare collision cases
                for attempt in range(max_attempts):
                    # Generate 6-character random string (alphanumeric)
                    random_suffix = secrets.token_urlsafe(4)[:6]  # Gets ~6 chars
                    slug_path = f"{base_path}-{random_suffix}{extension}"
                    
                    # Check if this path already exists in database
                    check_stmt = select(File).where(File.link == slug_path)
                    path_exists = await session.exec(check_stmt)
                    if not path_exists.first() and not os.path.exists(slug_path):
                        full_path = slug_path
                        break
                else:
                    # Fallback if all attempts failed (extremely unlikely)
                    import time
                    timestamp_suffix = str(int(time.time()))[-6:]
                    full_path = f"{base_path}-{timestamp_suffix}{extension}"

            # save metadata
            file_metadata = File(
                name=filename,
                link=full_path,
                type=extension,
                media_type=media_type,
                hash=hash,
                uploaded_by=uploaded_by,
                chunks=[],
            )
            session.add(file_metadata)
            await session.flush()
            await session.refresh(file_metadata)
            file_id = file_metadata.id

            # save file
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            async with aiofiles.open(full_path, "wb") as f:
                await f.write(content)

            # Process and generate chunks and embeddings
            chunks = await _extract_text_and_chunk(full_path, extension, filename)
            embeddings = vector_embedding_chunks(chunks)
            
            if len(chunks) != len(embeddings):
                raise Exception(f"Mismatch between chunks and embeddings for {filename}")
            
            for chunk_content, embedding in zip(chunks, embeddings):
                chunk = Chunk(
                    content=chunk_content,
                    vector=embedding.tolist(),
                    file_id=file_metadata.id,
                )
                session.add(chunk)
            await session.commit()

            return {
                "filename": filename,
                "status": "success",
                "file_id": file_id,
            }

        async def _extract_text_and_chunk(full_path: str, extension: str, filename: str):
            """Extract text and generate chunks based on file type"""
            # Automatically embed if .docx
            if extension == ".docx":
                text = read_docx_file(full_path)
                chunks = chunk_text(text)
            elif extension == ".pdf":
                text = read_pdf_file(full_path)
                chunks = chunk_text(text)
            elif extension == ".txt":
                text = read_txt_file(full_path)
                chunks = chunk_text(text)
            elif extension in [".xls", ".xlsx"]:
                # logger.info(f"Processing Excel file: {filename}")
                try:
                    chunks = read_excel_file(full_path)
                    # logger.info(f"Excel chunks extracted: {len(chunks) if chunks else 0} chunks")
                    if not chunks:
                        raise Exception(
                            f"No valid chunks found in Excel file {filename}. The file may be empty or contain no readable data."
                        )
                except Exception as excel_error:
                    # logger.error(f"Error processing Excel file {filename}: {str(excel_error)}")
                    raise Exception(
                        f"Failed to process Excel file {filename}: {str(excel_error)}"
                    )
            else:
                raise Exception(f"Unsupported file type: {extension}")

            if not chunks:
                raise Exception(f"No valid chunks extracted from {filename}")
            
            return chunks

        tasks = [_process_file(file) for file in files]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        await engine.dispose()  # Đóng engine sau khi hoàn tất
        return results

    return asyncio.run(_process())
