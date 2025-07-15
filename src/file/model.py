from sqlmodel import Column, Field, SQLModel, ForeignKey, Relationship
import sqlalchemy.dialects.postgresql as pg
from datetime import datetime
from typing import List, TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from src.chunk.model import Chunk  # Avoid circular import issues
    from src.admin.model import Admin  # Avoid circular import issues


class File(SQLModel, table=True):
    __tablename__ = "File"
    id: uuid.UUID = Field(
        sa_column=Column(pg.UUID, nullable=False, primary_key=True, default=uuid.uuid4)
    )

    name: str = Field(sa_column=Column(pg.VARCHAR, nullable=False, unique=True))
    link: str
    uploaded_by: uuid.UUID = Field(foreign_key="Admin.id", nullable=False)
    created_at: datetime = Field(sa_column=Column(pg.TIMESTAMP, default=datetime.now))
    updated_at: datetime = Field(sa_column=Column(pg.TIMESTAMP, default=datetime.now))
    chunks: List["Chunk"] = Relationship(
        back_populates="file",
    )
    admin: "Admin" = Relationship(
        back_populates="files",
        sa_relationship_kwargs={
            "lazy": "selectin",
        },
    )

    def __repr__(self):
        return f"<File {self.name} uploaded by {self.uploaded_by} at {self.created_at}, updated at {self.updated_at}>"
