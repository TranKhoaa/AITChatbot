from pydantic import BaseModel, Field
from datetime import datetime
import uuid
from src.file.model import FileStatus

class FileSchema(BaseModel):
    id: uuid.UUID
    name: str
    link: str
    type: str
    status: FileStatus
    error_message: str = ""
    file_size: int = 0
    upload_progress: float = 0.0
    uploaded_by: uuid.UUID
    created_at: datetime
    updated_at: datetime


class FileUploadResponse(BaseModel):
    file_id: str
    filename: str
    status: str
    message: str


class FileStatusResponse(BaseModel):
    file_id: str
    filename: str
    status: FileStatus
    progress: float
    file_size: int
    error_message: str = ""
    created_at: datetime
    updated_at: datetime