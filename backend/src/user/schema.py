from pydantic import BaseModel, Field
from datetime import datetime
import uuid

class UserSchema(BaseModel):
    id: uuid.UUID
    name: str
    password: str
    created_at: datetime
    updated_at: datetime