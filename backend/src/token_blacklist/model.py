from sqlmodel import SQLModel, Field
from datetime import datetime, timezone
from typing import Optional
import uuid


class TokenBlacklist(SQLModel, table=True):
    """
    Model for storing blacklisted tokens.
    When a user or admin logs out, their tokens are added to this blacklist.
    """
    __tablename__ = "token_blacklist"
    
    id: Optional[uuid.UUID] = Field(default_factory=uuid.uuid4, primary_key=True)
    jti: str = Field(index=True, unique=True)  # JWT Token ID (unique identifier from token)
    token_type: str = Field(index=True)  # "access" or "refresh"
    blacklisted_at: Optional[datetime] = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    expires_at: Optional[datetime] = Field(index=True)  # Token expiration time for cleanup
    
    class Config:
        from_attributes = True
