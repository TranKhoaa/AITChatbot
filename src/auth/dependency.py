from typing import Optional
from fastapi import Request, Depends
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

def AccessTokenBearer(payload: dict = Depends(TokenBearer(type="access"))):
    if payload["type"] != "access":
        raise HTTPException(
            status_code=403,
            detail="Access token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload

def RefreshTokenBearer(payload: dict = Depends(TokenBearer(type="refresh"))):
    if payload["type"] != "refresh":
        raise HTTPException(
            status_code=403,
            detail="Refresh token required",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload