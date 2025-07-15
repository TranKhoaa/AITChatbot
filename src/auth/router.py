from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from .service import AuthService
from src.db.main import get_session
from .schema import UserCreateSchema, AdminCreateSchema

auth_router = APIRouter()
auth_service = AuthService()


@auth_router.post("/signup/user", status_code=status.HTTP_201_CREATED)
async def signup_user(
    user_data: UserCreateSchema, session: AsyncSession = Depends(get_session)
):
    """
    Endpoint to create a new user.
    """
    if await auth_service.user_exists(user_data.name, session):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="User already exists"
        )

    user = await auth_service.create_user(user_data, session)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "message": "User created successfully",
            "user_id": str(user.id),
            "name": user.name,
        },
    )


@auth_router.post("/signup/admin", status_code=status.HTTP_201_CREATED)
async def signup_admin(
    admin_data: AdminCreateSchema, session: AsyncSession = Depends(get_session)
):
    """
    Endpoint to create a new admin.
    """
    if await auth_service.admin_exists(admin_data.name, session):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Admin already exists"
        )

    admin = await auth_service.create_admin(admin_data, session)
    return JSONResponse(
        status_code=status.HTTP_201_CREATED,
        content={
            "message": "Admin created successfully",
            "admin_id": str(admin.id),
            "name": admin.name,
        },
    )
