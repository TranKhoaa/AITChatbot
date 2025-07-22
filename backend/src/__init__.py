from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from fastapi.exceptions import HTTPException
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.requests import Request
from fastapi.middleware.cors import CORSMiddleware
from src.auth.router import auth_router
from src.file.router import file_router
from src.chat.router import chat_router
# Import all models to ensure they are registered with SQLAlchemy
# This must be done before any SQLAlchemy operations
import src.db  # This will import all models

version = "v1"

app = FastAPI(
    version=version,
)
app.mount("/assets", StaticFiles(directory="static/assets"), name="assets")
app.mount("/static", StaticFiles(directory="static"), name="static")

origins = [
    # "http://localhost:5173",
    # "http://127.0.0.1:5500",
    # "http://192.168.241.94:8000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# React entry point
@app.get("/")
async def index():
    return FileResponse(os.path.join("static", "index.html"))

app.include_router(auth_router, prefix=f"/api/{version}/auth", tags=["auth"])
app.include_router(file_router, prefix=f"/api/{version}/admin/file", tags=["file"])
app.include_router(chat_router, prefix=f"/api/{version}/user/chat", tags=["chat"])
@app.get("/{full_path:path}")
async def serve_react_app(full_path: str, request: Request):
    # Nếu là yêu cầu file tĩnh (CSS, JS, hình ảnh), thì trả 404 chứ không nuốt
    if "." in full_path:
        raise StarletteHTTPException(status_code=404)
    return FileResponse(os.path.join("static", "index.html"))

