import asyncio
import os
import aiofiles
import mimetypes
import logging
from datetime import datetime
from sqlmodel.ext.asyncio.session import AsyncSession
from sqlmodel import select
from src.file.model import File, FileStatus
from src.db.main import get_session_generator
from src.websocket.manager import manager
import uuid

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB limit
UPLOAD_DIR = os.path.expanduser("./uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def process_file_upload(file_id: str, file_content: bytes, original_filename: str, 
                            user_id: str):
    """Background task to process file upload."""
    
    # Create new session for background task
    async for session in get_session_generator():
        try:
            # Get file record from database
            statement = select(File).where(File.id == uuid.UUID(file_id))
            result = await session.exec(statement)
            file_record = result.first()
            
            if not file_record:
                logger.error(f"File record not found for ID: {file_id}")
                return
            
            # Update status to processing
            file_record.status = FileStatus.PROCESSING
            file_record.upload_progress = 0
            await session.commit()
            
            # Notify user about processing start
            await manager.send_upload_notification(
                user_id=user_id,
                file_id=file_id,
                status="processing",
                filename=original_filename,
                progress=0
            )
            
            # Check file size
            file_size = len(file_content)
            if file_size > MAX_FILE_SIZE:
                raise Exception(f"File too large: {file_size} bytes exceeds {MAX_FILE_SIZE} bytes limit")
            
            # Sanitize and construct file path
            safe_filename = os.path.normpath(original_filename).replace("..", "").lstrip("/")
            full_path = os.path.join(UPLOAD_DIR, safe_filename)
            os.makedirs(os.path.dirname(full_path), exist_ok=True)
            
            # Save file with progress tracking
            chunk_size = 1024 * 8  # 8KB chunks
            total_chunks = len(file_content) // chunk_size + (1 if len(file_content) % chunk_size else 0)
            
            async with aiofiles.open(full_path, "wb") as out_file:
                for i in range(0, len(file_content), chunk_size):
                    chunk = file_content[i:i + chunk_size]
                    await out_file.write(chunk)
                    
                    # Calculate and update progress
                    progress = min(100, ((i // chunk_size + 1) / total_chunks) * 100)
                    
                    # Update progress in database
                    file_record.upload_progress = progress
                    await session.commit()
                    
                    # Notify user about progress
                    await manager.send_upload_notification(
                        user_id=user_id,
                        file_id=file_id,
                        status="processing",
                        filename=original_filename,
                        progress=progress
                    )
                    
                    # Small delay to simulate processing and allow for progress updates
                    await asyncio.sleep(0.01)
            
            # Get file content type
            content_type = mimetypes.guess_type(original_filename)[0] or "application/octet-stream"
            file_extension = os.path.splitext(original_filename)[1].lower()
            
            # Update file record with final details
            file_record.link = full_path
            file_record.type = file_extension
            file_record.file_size = file_size
            file_record.status = FileStatus.COMPLETED
            file_record.upload_progress = 100
            file_record.updated_at = datetime.now()
            await session.commit()
            
            # Notify user about completion
            await manager.send_upload_notification(
                user_id=user_id,
                file_id=file_id,
                status="completed",
                filename=original_filename,
                progress=100
            )
            
            logger.info(f"File upload completed successfully: {file_id}")
            break  # Exit the session generator loop
            
        except Exception as e:
            logger.error(f"Error processing file upload {file_id}: {str(e)}")
            
            # Update file record with error
            try:
                file_record.status = FileStatus.FAILED
                file_record.error_message = str(e)
                file_record.updated_at = datetime.now()
                await session.commit()
                
                # Notify user about error
                await manager.send_upload_notification(
                    user_id=user_id,
                    file_id=file_id,
                    status="failed",
                    filename=original_filename,
                    error_message=str(e)
                )
            except Exception as commit_error:
                logger.error(f"Failed to update file record with error: {commit_error}")
            break  # Exit the session generator loop


async def create_background_upload_task(file_content: bytes, original_filename: str, 
                                      user_id: str, session: AsyncSession) -> str:
    """Create a file record and start background upload processing."""
    
    # Create initial file record
    file_record = File(
        name=original_filename,
        type="",  # Will be set during processing
        status=FileStatus.UPLOADING,
        uploaded_by=uuid.UUID(user_id),
        file_size=0,  # Will be set during processing
        upload_progress=0
    )
    
    session.add(file_record)
    await session.commit()
    await session.refresh(file_record)
    
    file_id = str(file_record.id)
    
    # Start background task
    task = asyncio.create_task(
        process_file_upload(file_id, file_content, original_filename, user_id)
    )
    
    # Don't await the task - let it run in background
    return file_id
