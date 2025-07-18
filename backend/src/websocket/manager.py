from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, List, Set
import json
import logging
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Dictionary to store WebSocket connections by user ID
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a new WebSocket connection and associate it with a user ID."""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove a WebSocket connection."""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # Remove user entry if no connections left
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                
        logger.info(f"User {user_id} disconnected")

    async def send_personal_message(self, message: dict, user_id: str):
        """Send a message to a specific user (all their connections)."""
        if user_id in self.active_connections:
            disconnected_websockets = []
            
            for websocket in self.active_connections[user_id].copy():
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Failed to send message to user {user_id}: {e}")
                    disconnected_websockets.append(websocket)
            
            # Clean up disconnected websockets
            for ws in disconnected_websockets:
                self.disconnect(ws, user_id)

    async def send_upload_notification(self, user_id: str, file_id: str, status: str, 
                                     filename: str = "", progress: float = 0, 
                                     error_message: str = ""):
        """Send file upload notification to user."""
        message = {
            "type": "file_upload",
            "timestamp": datetime.now().isoformat(),
            "data": {
                "file_id": file_id,
                "filename": filename,
                "status": status,
                "progress": progress,
                "error_message": error_message
            }
        }
        
        await self.send_personal_message(message, user_id)

    def get_user_connections_count(self, user_id: str) -> int:
        """Get the number of active connections for a user."""
        return len(self.active_connections.get(user_id, set()))


# Global connection manager instance
manager = ConnectionManager()
