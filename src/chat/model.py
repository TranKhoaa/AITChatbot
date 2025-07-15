from sqlmodel import Column, Field, SQLModel, ForeignKey, Relationship
import sqlalchemy.dialects.postgresql as pg
from datetime import datetime
from typing import List, TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from src.user.model import User  # Avoid circular import issues
    from src.chat_history.model import Chat_history  # Avoid circular import issues


class Chat(SQLModel, table=True):
    __tablename__ = "Chat"
    id: uuid.UUID = Field(
        sa_column=Column(pg.UUID, nullable=False, primary_key=True, default=uuid.uuid4)
    )

    name: str
    user_id: uuid.UUID = Field(foreign_key="User.id", nullable=False)
    created_at: datetime = Field(sa_column=Column(pg.TIMESTAMP, default=datetime.now))
    updated_at: datetime = Field(sa_column=Column(pg.TIMESTAMP, default=datetime.now))
    chat_history: List["Chat_history"] = Relationship(
        back_populates="chat",
    )
    user: "User" = Relationship(
        back_populates="chats",
    )

    def __repr__(self):
        return f"<Chat {self.name} of {self.user_id} at {self.created_at}, updated at {self.updated_at}>"
