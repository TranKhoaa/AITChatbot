from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from .service import AuthService
from src.db.main import get_session
from .schema import (
    UserCreateSchema,
    AdminCreateSchema,
    UserLoginSchema,
    AdminLoginSchema,
)
from src.auth.utils import create_token, verify_password

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


@auth_router.post("/login/user")
async def login_user(
    user_data: UserLoginSchema, session: AsyncSession = Depends(get_session)
):
    """
    Endpoint for user login.
    """
    user = await auth_service.get_user_by_name(user_data.name, session)
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    payload = {
        "user_id": str(user.id),
        "name": user.name,
        "role": "user",
    }
    access_token = create_token(user_data=payload, type="access")
    refresh_token = create_token(user_data=payload, type="refresh")

    # Generate and return JWT token (not implemented in this snippet)
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "User logged in successfully",
            "id": str(user.id),
            "name": user.name,
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
    )


@auth_router.post("/login/admin")
async def login_admin(
    admin_data: AdminLoginSchema, session: AsyncSession = Depends(get_session)
):
    """
    Endpoint for admin login.
    """
    admin = await auth_service.get_admin_by_name(admin_data.name, session)
    if not admin or not verify_password(admin_data.password, admin.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )

    payload = {
        "admin_id": str(admin.id),
        "name": admin.name,
        "role": "admin",
    }
    access_token = create_token(user_data=payload, type="access")
    refresh_token = create_token(user_data=payload, type="refresh")

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "Admin logged in successfully",
            "id": str(admin.id),
            "name": admin.name,
            "access_token": access_token,
            "refresh_token": refresh_token,
        },
    )
