
\
from typing import Optional
from fastapi import Request, Depends, Cookie
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from fastapi import HTTPException
from .utils import decode_token


class TokenBearer(HTTPBearer):
    def __init__(self, auto_error: bool = True, type: str = "access"):
        super().__init__(auto_error=auto_error)
        self.type = type

    async def __call__(
        self, request: Request
    ) -> Optional[HTTPAuthorizationCredentials]:
        creds = await super().__call__(request)

        token = creds.credentials
        if not token:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )

        try:
            payload = decode_token(token, type=self.type)
            if not payload:
                raise HTTPException(
                    status_code=401,
                    detail="Invalid authentication credentials",
                    headers={"WWW-Authenticate": "Bearer"},
                )
        except Exception as e:
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            ) from e

        return payload


def AccessTokenBearerUser(payload: dict = Depends(TokenBearer(type="access"))):
    if payload["type"] != "access" or payload["data"]["role"] != "user":
        raise HTTPException(
            status_code=403,
            detail="Access token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def RefreshTokenBearerUser(
    refresh_token: Optional[str] = Cookie(None, alias="refresh_token")
):
    """
    Dependency to get refresh token from httpOnly cookie for user
    """
    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Refresh token not found in cookie",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(refresh_token, type="refresh")
        if not payload:
            raise HTTPException(
                status_code=401,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if payload["type"] != "refresh" or payload["data"]["role"] != "user":
            raise HTTPException(
                status_code=403,
                detail="Invalid refresh token for user",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return payload
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e


def AccessTokenBearerAdmin(payload: dict = Depends(TokenBearer(type="access"))):
    if payload["type"] != "access" or payload["data"]["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Access token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def RefreshTokenBearerAdmin(
    refresh_token: Optional[str] = Cookie(None, alias="refresh_token")
):
    """
    Dependency to get refresh token from httpOnly cookie for admin
    """
    if not refresh_token:
        raise HTTPException(
            status_code=401,
            detail="Refresh token not found in cookie",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(refresh_token, type="refresh")
        if not payload:
            raise HTTPException(
                status_code=401,
                detail="Invalid refresh token",
                headers={"WWW-Authenticate": "Bearer"},
            )

        if payload["type"] != "refresh" or payload["data"]["role"] != "admin":
            raise HTTPException(
                status_code=403,
                detail="Invalid refresh token for admin",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return payload
    except Exception as e:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from e
