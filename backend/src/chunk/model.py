from sqlmodel import Column, Field, SQLModel, ForeignKey, Index, Relationship
import sqlalchemy.dialects.postgresql as pg
from pgvector.sqlalchemy import Vector
from datetime import datetime
from typing import TYPE_CHECKING
import uuid

if TYPE_CHECKING:
    from src.file.model import File  # Avoid circular import issues


class Chunk(SQLModel, table=True):
    __tablename__ = "Chunk"
    __table_args__ = (
        # HNSW index for cosine similarity (best for most RAG use cases)
        Index(
            "idx_chunk_vector_cosine_hnsw",
            "vector",
            postgresql_using="hnsw",
            postgresql_with={"m": 16, "ef_construction": 64},
            postgresql_ops={"vector": "vector_cosine_ops"},
        ),
        # Optional: IVFFlat index for cosine similarity (alternative)
        # Index(
        #     "idx_chunk_vector_cosine_ivfflat",
        #     "vector",
        #     postgresql_using="ivfflat",
        #     postgresql_with={"lists": 100},
        #     postgresql_ops={"vector": "vector_cosine_ops"}
        # ),
    )

    id: uuid.UUID = Field(
        sa_column=Column(pg.UUID, nullable=False, primary_key=True, default=uuid.uuid4)
    )

    content: str
    vector: list[float] = Field(
        sa_column=Column(Vector(768), nullable=False)
    )  # 1536 is common for OpenAI embeddings
    file_id: uuid.UUID = Field(foreign_key="File.id", nullable=False)
    created_at: datetime = Field(sa_column=Column(pg.TIMESTAMP, default=datetime.now))
    updated_at: datetime = Field(sa_column=Column(pg.TIMESTAMP, default=datetime.now))
    file: "File" = Relationship(
        back_populates="chunks",
        sa_relationship_kwargs={
            "lazy": "selectin",
        },
    )

    def __repr__(self):
        return f"<Chunk - file_id: {self.file_id}\n    {self.content}>"
