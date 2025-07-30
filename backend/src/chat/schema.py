from pydantic import BaseModel
from typing import Optional
import uuid
from datetime import datetime


class QuestionSchema(BaseModel):
    """Request model for question endpoint"""
    chat_id: Optional[str] = None
    question: str
    # translate_to_vietnamese: bool = False  # Optional flag for translation

class CreateChatSchema(BaseModel):
    """Request model for creating a new chat."""
    name: str = "New Chat"  

class ChatHistorySchema(BaseModel):
    """Response model for chat history endpoint."""
    id: uuid.UUID
    content:str
    source: str
    created_at: datetime
    class Config:
        orm_mode = True
