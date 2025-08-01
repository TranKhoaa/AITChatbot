from uuid import UUID
from requests import session
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
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
from .schema import RenameChatSchema
from .utils import (
    question_embedding,
    construct_prompt,
    query_ollama,
    translate_to_vietnam,
    chat_gen,
)
from .schema import QuestionSchema, CreateChatSchema, ChatHistorySchema

chat_router = APIRouter()


@chat_router.get("/")
async def get_chats(
    user_detail: dict = Depends(AccessTokenBearerUser),
    session: AsyncSession = Depends(get_session),
):
    """Retrieve all chats for the authenticated user"""
    try:
        statement = select(Chat).where(Chat.user_id == user_detail["data"]["id"])
        result = await session.exec(statement)
        chats = result.all()
        return [chat for chat in chats]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve chats: {str(e)}"
        )


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
        return {
            "id": chat.id,
            "name": chat.name,
            "created_at": chat.created_at,
            "updated_at": chat.updated_at,
        }
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create chat: {str(e)}")


@chat_router.post("/ask", status_code=status.HTTP_200_OK)
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
            statement = select(Chat).where(
                Chat.id == request.chat_id, Chat.user_id == user_detail["data"]["id"]
            )
            result = await session.exec(statement)
            chat = result.first()
            if not chat:
                raise HTTPException(
                    status_code=404, detail="Chat not found or not owned by user"
                )
            chat_id = request.chat_id

        # Embed the question
        try:
            query_vector = question_embedding(request.question)
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Failed to embed question: {str(e)}"
            )

        # Perform vector search for top 3 chunks
        vector_search = VectorSearch(session)
        await vector_search.optimize_search_parameters()  # Optimize for HNSW index
        similar_chunks = await vector_search.similarity_search_cosine(
            query_vector=query_vector,
            limit=3,
            similarity_threshold=0.3,  # Only chunks with >30% similarity
        )

        # Prepare context from chunks
        context = [chunk.content for chunk in similar_chunks]
        chunk_ids = [str(chunk.id) for chunk in similar_chunks]

        # Store question in Chat_history
        question_entry = Chat_history(
            content=request.question,
            source="user",
            chat_id=chat_id,
            model=request.model_id or "qwen2:0.5b",
        )
        session.add(question_entry)
        await session.commit()  # Commit question immediately

        # Call LLM
        try:
            prompt = construct_prompt(request.question, context)
            return StreamingResponse(
                chat_gen(prompt, session, chat_id, request.model_id),
                media_type="text/event-stream",
            )
        #     answer = query_ollama(prompt)
        except Exception as e:
            raise HTTPException(
                status_code=400, detail=f"Failed to generate answer: {str(e)}"
            )

        # # Translate answer to Vietnamese if requested
        # final_answer = translate_to_vietnam(answer)

        # answer_entry = Chat_history(
        #     content=final_answer,
        #     source="bot",
        #     chat_id=chat_id,
        #     created_at=datetime.now(),
        #     updated_at=datetime.now(),
        # )
        # session.add(answer_entry)

        # await session.commit()

        # return {
        #     "chat_id": chat_id,
        #     "question": request.question,
        #     "answer": final_answer,
        #     "chunk_ids": chunk_ids,
        # }
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
        statement = select(Chat).where(
            Chat.id == chat_id, Chat.user_id == user_detail["data"]["id"]
        )
        result = await session.exec(statement)
        chat = result.first()
        if not chat:
            raise HTTPException(
                status_code=404, detail="Chat not found or not owned by user"
            )

        # Retrieve chat history, ordered by created_at
        history_statement = (
            select(Chat_history)
            .where(Chat_history.chat_id == chat_id)
            .order_by(Chat_history.created_at)
        )
        result = await session.exec(history_statement)
        history = result.all()

        # Format response
        return [
            ChatHistorySchema(
                id=entry.id,
                content=entry.content,
                source=entry.source,
                created_at=entry.created_at,
                model_id=entry.model,
            )
            for entry in history
        ]
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to retrieve chat history: {str(e)}"
        )


@chat_router.delete("/{chat_id}", status_code=204)
async def delete_chat(
    chat_id: UUID,
    user_detail: dict = Depends(AccessTokenBearerUser),
    session: AsyncSession = Depends(get_session),
):
    """Delete a chat and its history for the authenticated user."""
    try:
        # Verify chat exists and belongs to the user
        statement = select(Chat).where(
            Chat.id == chat_id, Chat.user_id == user_detail["data"]["id"]
        )
        result = await session.exec(statement)
        chat = result.first()
        if not chat:
            raise HTTPException(
                status_code=404, detail="Chat not found or not owned by user"
            )

        # Delete all chat history
        history_statement = select(Chat_history).where(Chat_history.chat_id == chat_id)
        history_result = await session.exec(history_statement)
        history_entries = history_result.all()
        for entry in history_entries:
            await session.delete(entry)

        # Delete the chat
        await session.delete(chat)
        await session.commit()
        return {"message": "Chat deleted successfully."}
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete chat: {str(e)}")


@chat_router.put("/")
async def rename_chat(
    payload: RenameChatSchema,
    user_detail: dict = Depends(AccessTokenBearerUser),
    session: AsyncSession = Depends(get_session),
):
    """Rename a chat if it belongs to the authenticated user."""
    try:
        # Kiểm tra quyền sở hữu chat
        statement = select(Chat).where(
            Chat.id == payload.id, Chat.user_id == user_detail["data"]["id"]
        )
        result = await session.exec(statement)
        chat = result.first()
        if not chat:
            raise HTTPException(
                status_code=404, detail="Chat not found or not owned by user"
            )

        # Đổi tên chat
        chat.name = payload.new_name
        chat.updated_at = datetime.now()
        session.add(chat)
        await session.commit()
        await session.refresh(chat)

        return {
            "message": "Chat renamed successfully.",
            "id": str(chat.id),
            "new_name": chat.name,
        }
    except Exception as e:
        await session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to rename chat: {str(e)}")
