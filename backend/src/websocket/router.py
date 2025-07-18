from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException
from src.websocket.manager import manager
from src.auth.dependency import get_current_user_from_websocket
import logging

logger = logging.getLogger(__name__)

websocket_router = APIRouter()


@websocket_router.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    """WebSocket endpoint for real-time notifications."""
    try:
        # Validate user authentication (you might want to add token validation here)
        await manager.connect(websocket, user_id)
        
        try:
            while True:
                # Keep connection alive and handle incoming messages if needed
                data = await websocket.receive_text()
                # You can handle client messages here if needed
                logger.info(f"Received message from user {user_id}: {data}")
                
        except WebSocketDisconnect:
            manager.disconnect(websocket, user_id)
            logger.info(f"User {user_id} disconnected")
            
    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}")
        manager.disconnect(websocket, user_id)
