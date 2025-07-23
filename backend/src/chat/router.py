from uuid import UUID
from requests import session
from fastapi import APIRouter, Depends, HTTPException, status
from src.db.main import get_session
from sqlmodel.ext.asyncio.session import AsyncSession
from src.auth.dependency import AccessTokenBearerUser
from .model import Chat
from src.chat_history.model import Chat_history
from src.chunk.model import Chunk
from sqlmodel import select
from typing import List, Optional
from datetime import datetime
from src.db.vector_search import VectorSearch
from .utils import question_embedding, construct_prompt, query_ollama, translate_to_vietnam
from .schema import (
    QuestionSchema,
    CreateChatSchema,
    ChatHistorySchema
)
chat_router = APIRouter()

@chat_router.post("/create")
async def create_chat(
    request: CreateChatSchema,
    user_detail: dict = Depends(AccessTokenBearerUser),
    session: AsyncSession = Depends(get_session),
):
    """Create a new chat with a random UUID"""
    try:
        chat = Chat(
            name=request.name,
            user_id=user_detail["data"]["id"],
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        session.add(chat)
        await session.commit()
        await session.refresh(chat)
        return {"chat_id": chat.id, "name": chat.name}
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create chat: {str(e)}")

@chat_router.post("/ask")
async def ask_question(
    request: QuestionSchema,
    user_detail: dict = Depends(AccessTokenBearerUser),
    session: AsyncSession = Depends(get_session),
):
    """Handle a user question, perform vector search, call Ollama, and return answer"""
    try:
        # If no chat_id provided, create a new chat
        if request.chat_id is None:
            chat = Chat(
                name="New Chat",
                user_id=user_detail["data"]["id"],
                created_at=datetime.now(),
                updated_at=datetime.now(),
            )
            session.add(chat)
            await session.commit()
            await session.refresh(chat)
            chat_id = chat.id
        else:
            # Verify chat exists and belongs to the user
            statement = select(Chat).where(Chat.id == request.chat_id, Chat.user_id == user_detail["data"]["id"])
            result = await session.exec(statement)
            chat = result.first()
            if not chat:
                raise HTTPException(status_code=404, detail="Chat not found or not owned by user")
            chat_id = request.chat_id

        # Embed the question
        try:
            query_vector = question_embedding(request.question)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to embed question: {str(e)}")

        # Perform vector search for top 3 chunks
        vector_search = VectorSearch(session)
        await vector_search.optimize_search_parameters()  # Optimize for HNSW index
        similar_chunks = await vector_search.similarity_search_cosine(
            query_vector=query_vector,
            limit=3,
            similarity_threshold=0.3  # Only chunks with >30% similarity
        )
    
        # Prepare context from chunks
        context = [chunk.content for chunk in similar_chunks]
        chunk_ids = [str(chunk.id) for chunk in similar_chunks]

        # Call LLM
        try:
            prompt = construct_prompt(request.question, context)
            answer = query_ollama(prompt)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to generate answer: {str(e)}")

        # Translate answer to Vietnamese if requested
        final_answer = translate_to_vietnam(answer) 

        # Store question and answer in Chat_history
        question_entry = Chat_history(
            content=request.question,
            source="user",
            chat_id=chat_id,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        session.add(question_entry)

        answer_entry = Chat_history(
            content=final_answer,
            source="bot",
            chat_id=chat_id,
            created_at=datetime.now(),
            updated_at=datetime.now(),
        )
        session.add(answer_entry)

        await session.commit()

        return {
            "chat_id": chat_id,
            "question": request.question,
            "answer": final_answer,
            "chunk_ids": chunk_ids
        }
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@chat_router.get("/{chat_id}/history")
async def get_chat_history(
    chat_id: UUID,
    user_detail: dict = Depends(AccessTokenBearerUser),
    session: AsyncSession = Depends(get_session),
):
    """Retrieve the chat history for a given chat_id, ordered by creation time."""
    try:
        # Verify chat exists and belongs to the user
        statement = select(Chat).where(Chat.id == chat_id, Chat.user_id == user_detail["data"]["id"])
        result = await session.exec(statement)
        chat = result.first()
        if not chat:
            raise HTTPException(status_code=404, detail="Chat not found or not owned by user")

        # Retrieve chat history, ordered by created_at
        history_statement = select(Chat_history).where(Chat_history.chat_id == chat_id).order_by(Chat_history.created_at)
        result = await session.exec(history_statement)
        history = result.all()

        # Format response
        return [
            ChatHistorySchema(
                id=entry.id,
                content=entry.content,
                source=entry.source,
                created_at=entry.created_at
            )
            for entry in history
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve chat history: {str(e)}")