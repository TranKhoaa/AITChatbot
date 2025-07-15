from sqlmodel import Column, Field, SQLModel, ForeignKey, Index, Relationship
import sqlalchemy.dialects.postgresql as pg
from datetime import datetime
from typing import TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from src.chat.model import Chat  # Avoid circular import issues


class Chat_history(SQLModel, table=True):
    __tablename__ = "Chat_history"
    id: uuid.UUID = Field(
        sa_column=Column(pg.UUID, nullable=False, primary_key=True, default=uuid.uuid4)
    )

    content: str
    source: str
    chat_id: uuid.UUID = Field(foreign_key="Chat.id", nullable=False)
    created_at: datetime = Field(
        sa_column=Column(pg.TIMESTAMP, default=datetime.now, index=True)
    )
    updated_at: datetime = Field(sa_column=Column(pg.TIMESTAMP, default=datetime.now))
    chat: "Chat" = Relationship(
        back_populates="chat_history",
        sa_relationship_kwargs={
            "lazy": "selectin",
        },
    )

    def __repr__(self):
        return f"<Chat_history - chat_id: {self.chat_id} - src: {self.source}\n    {self.content}>"
