from fastapi import (WebSocket, WebSocketDisconnect,) 
from typing import List, Dict

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, admin_id: str = None):
        await websocket.accept()
        if admin_id:
            if admin_id not in self.active_connections:
                self.active_connections[admin_id] = []
            self.active_connections[admin_id].append(websocket)
            print(f"WebSocket connected for admin {admin_id}. Total connections: {len(self.active_connections[admin_id])}")
        else:
            print("WebSocket connected without admin_id")

    def disconnect(self, websocket: WebSocket, admin_id: str = None):
        if admin_id and admin_id in self.active_connections:
            if websocket in self.active_connections[admin_id]:
                self.active_connections[admin_id].remove(websocket)
                print(f"WebSocket disconnected for admin {admin_id}. Total connections: {len(self.active_connections[admin_id])}")
                if not self.active_connections[admin_id]:
                    del self.active_connections[admin_id]
            else:
                print(f"WebSocket not found in connections for admin {admin_id}")
        else:
            print("WebSocket disconnect called without valid admin_id or no connections")

    async def broadcast(self, admin_id: str, message: dict):
        if admin_id in self.active_connections:
            for connection in self.active_connections[admin_id]:
                await connection.send_json(message)
                print(f"Sent message to admin {admin_id}: {message}")
        else:
            print(f"No active connections for admin {admin_id}")

    
