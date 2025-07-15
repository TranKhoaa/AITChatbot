# Import all models to ensure they are registered with SQLAlchemy
# This ensures proper relationship resolution
from src.user.model import User
from src.chat.model import Chat
from src.chat_history.model import Chat_history
from src.admin.model import Admin
from src.file.model import File
from src.chunk.model import Chunk

__all__ = ["User", "Chat", "Chat_history", "Admin", "File", "Chunk"]