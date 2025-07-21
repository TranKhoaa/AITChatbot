from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import os
from fastapi.middleware.cors import CORSMiddleware
from src.auth.router import auth_router
from src.file.router import file_router

# Import all models to ensure they are registered with SQLAlchemy
# This must be done before any SQLAlchemy operations
import src.db  # This will import all models

version = "v1"

app = FastAPI(
    version=version,
)
app.mount("/", StaticFiles(directory="static", html=True), name="static")

# Route fallback cho React Router
@app.get("/{full_path:path}")
async def catch_all(full_path: str):
    return FileResponse(os.path.join("static", "index.html"))

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5500",
    "http://192.168.241.94:8000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# hello world endpoint
@app.get("/")
async def root():
    """Simple hello world endpoint"""
    return {"message": "Hello, World!"}


app.include_router(auth_router, prefix=f"/api/{version}/auth", tags=["auth"])
app.include_router(file_router, prefix=f"/api/{version}/admin/file", tags=["file"])
