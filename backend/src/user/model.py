from sqlmodel import Column, Field, SQLModel, Relationship
import sqlalchemy.dialects.postgresql as pg
from datetime import datetime
from typing import List, TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from src.chat.model import Chat  # Avoid circular import issues


class User(SQLModel, table=True):
    __tablename__ = "User"
    id: uuid.UUID = Field(
        sa_column=Column(pg.UUID, nullable=False, primary_key=True, default=uuid.uuid4)
    )

    name: str
    password_hash: str = Field(exclude=True)  # Exclude from serialization
    created_at: datetime = Field(sa_column=Column(pg.TIMESTAMP, default=datetime.now))
    updated_at: datetime = Field(sa_column=Column(pg.TIMESTAMP, default=datetime.now))
    chats: List["Chat"] = Relationship(
        back_populates="user",
        sa_relationship_kwargs={
            "lazy": "selectin",
        },
    )

    def __repr__(self):
        return f"<User {self.name}>"
