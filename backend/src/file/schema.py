from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class FileSchema(BaseModel):
    id: uuid.UUID
    name: str
    link: str
    type: str
    uploaded_by: uuid.UUID
    created_at: datetime
    updated_at: datetime