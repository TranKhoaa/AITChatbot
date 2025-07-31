from fastapi import APIRouter, Body, Depends, HTTPException, status, Response, Cookie, Request
from fastapi.responses import JSONResponse
from sqlmodel.ext.asyncio.session import AsyncSession
from .service import AuthService
from src.db.main import get_session
from .schema import (
    UserCreateSchema,
    AdminCreateSchema,
    UserLoginSchema,
    AdminLoginSchema,
    # DecodeTokenSchema,
)
from src.auth.utils import create_token, verify_password, extract_jti_from_token, decode_token
from .dependency import RefreshTokenBearerUser, RefreshTokenBearerAdmin
from src.token_blacklist.service import TokenBlacklistService
from datetime import datetime, timezone
from typing import Optional

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
    user_data: UserLoginSchema,
    session: AsyncSession = Depends(get_session),
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
        "id": str(user.id),
        "name": user.name,
        "role": "user",
    }
    access_token = create_token(data=payload, type="access")
    refresh_token = create_token(data=payload, type="refresh")

    response = JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "User logged in successfully",
            "id": str(user.id),
            "name": user.name,
            "role": "user",
            "access_token": access_token,
            # Don't return refresh_token in response body
        },
    )

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,  # Set to True in production with HTTPS
        # samesite="strict",  # Use strict for better security
        max_age=7 * 24 * 60 * 60,  # 7 days
    )

    return response


@auth_router.post("/login/admin")
async def login_admin(
    admin_data: AdminLoginSchema,
    session: AsyncSession = Depends(get_session),
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
        "id": str(admin.id),
        "name": admin.name,
        "role": "admin",
    }
    access_token = create_token(data=payload, type="access")
    refresh_token = create_token(data=payload, type="refresh")

    response = JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "Admin logged in successfully",
            "id": str(admin.id),
            "name": admin.name,
            "role": "admin",
            "access_token": access_token,
            # Don't return refresh_token in response body
        },
    )

    # Set refresh token as httpOnly cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        # secure=True,  # Set to True in production with HTTPS
        # samesite="strict",
        max_age=7 * 24 * 60 * 60,  # 7 days
    )

    return response


@auth_router.get("/refresh/user")
async def refresh_user_token(
    response: Response, payload: dict = Depends(RefreshTokenBearerUser)
):
    """
    Endpoint to refresh access token for user using refresh token from cookie
    """
    # Create new access token with the same payload data
    user_data = payload["data"]
    new_access_token = create_token(data=user_data, type="access")

    # # Optionally create new refresh token (token rotation)
    # new_refresh_token = create_token(data=user_data, type="refresh")

    # # Set new refresh token as httpOnly cookie
    # response.set_cookie(
    #     key="refresh_token",
    #     value=new_refresh_token,
    #     httponly=True,
    #     secure=True,  # Set to True in production with HTTPS
    #     samesite="strict",
    #     max_age=7 * 24 * 60 * 60,  # 7 days
    # )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "Token refreshed successfully",
            "access_token": new_access_token,
            "id": user_data["id"],
            "name": user_data["name"],
            "role": user_data["role"],
        },
    )


@auth_router.get("/refresh/admin")
async def refresh_admin_token(
    response: Response, payload: dict = Depends(RefreshTokenBearerAdmin)
):
    """
    Endpoint to refresh access token for admin using refresh token from cookie
    """
    # Create new access token with the same payload data
    admin_data = payload["data"]
    new_access_token = create_token(data=admin_data, type="access")

    # # Optionally create new refresh token (token rotation)
    # new_refresh_token = create_token(data=admin_data, type="refresh")

    # # Set new refresh token as httpOnly cookie
    # response.set_cookie(
    #     key="refresh_token",
    #     value=new_refresh_token,
    #     httponly=True,
    #     secure=True,  # Set to True in production with HTTPS
    #     samesite="strict",
    #     max_age=7 * 24 * 60 * 60,  # 7 days
    # )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "Token refreshed successfully",
            "access_token": new_access_token,
            "id": admin_data["id"],
            "name": admin_data["name"],
            "role": admin_data["role"],
        },
    )


@auth_router.post("/logout")
async def logout(
    request: Request,
    refresh_token: Optional[str] = Cookie(None, alias="refresh_token"),
    session: AsyncSession = Depends(get_session)
):
    """
    Endpoint to logout user/admin by blacklisting tokens and clearing refresh token cookie
    """
    blacklist_service = TokenBlacklistService()
    tokens_blacklisted = []
    # Try to get access token from Authorization header
    authorization: str = request.headers.get("Authorization")
    access_token = None
    if authorization and authorization.startswith("Bearer "):
        access_token = authorization.split(" ")[1]
        print(f"Found access token in Authorization header: {access_token[:20]}...")
    else:
        print("No Authorization header found or invalid format")
    
    # Blacklist access token if present
    if access_token:
        try:
            access_payload = decode_token(access_token, type="access")
            if access_payload:
                print(f"Access token decoded successfully. JTI: {access_payload['jti']}")
                # Convert timezone-aware datetime to naive for database storage
                expires_at = datetime.fromtimestamp(access_payload["exp"], tz=timezone.utc).replace(tzinfo=None)
                await blacklist_service.add_token_to_blacklist(
                    jti=access_payload["jti"],
                    token_type="access",
                    expires_at=expires_at,
                    session=session
                )
                tokens_blacklisted.append("access_token")
                print(f"Access token with JTI {access_payload['jti']} added to blacklist")
            else:
                print("Failed to decode access token")
        except Exception as e:
            print(f"Exception while processing access token: {str(e)}")
            # Token might be invalid or expired, but we still want to proceed with logout
            pass
    
    # Blacklist refresh token if present
    if refresh_token:
        print(f"Found refresh token in cookie: {refresh_token[:20]}...")
        try:
            refresh_payload = decode_token(refresh_token, type="refresh")
            if refresh_payload:
                print(f"Refresh token decoded successfully. JTI: {refresh_payload['jti']}")
                # Convert timezone-aware datetime to naive for database storage
                expires_at = datetime.fromtimestamp(refresh_payload["exp"], tz=timezone.utc).replace(tzinfo=None)
                await blacklist_service.add_token_to_blacklist(
                    jti=refresh_payload["jti"],
                    token_type="refresh",
                    expires_at=expires_at,
                    session=session
                )
                tokens_blacklisted.append("refresh_token")
                print(f"Refresh token with JTI {refresh_payload['jti']} added to blacklist")
            else:
                print("Failed to decode refresh token")
        except Exception as e:
            print(f"Exception while processing refresh token: {str(e)}")
            # Token might be invalid or expired, but we still want to proceed with logout
            pass
    else:
        print("No refresh token found in cookie")

    response = JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "message": "Logged out successfully",
            "tokens_blacklisted": tokens_blacklisted
        },
    )
    response.delete_cookie(key="refresh_token")
    return response

# @auth_router.post("/decode")
# async def decode(token: DecodeTokenSchema):
#     """
#     Endpoint to decode JWT token
#     """
#     token_data = decode_token(token.token)
#     if not token_data:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token"
#         )

#     return JSONResponse(
#         status_code=status.HTTP_200_OK,
#         content={
#             "message": "Token decoded successfully",
#             "data": token_data,
#         },
#     )