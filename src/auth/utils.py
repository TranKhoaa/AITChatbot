from passlib.context import CryptContext
from src.config import Config
from datetime import timedelta, datetime
from typing import Literal
import jwt
import uuid
import logging

Token_type = Literal["access", "refresh"]

ACCESS_DEFAULT_EXPIRE = timedelta(minutes=120)
REFRESH_DEFAULT_EXPIRE = timedelta(days=7)

passwd_context = CryptContext(schemes=["bcrypt"])


def generate_passwd_hash(password: str) -> str:
    hash = passwd_context.hash(password)
    return hash


def verify_password(password: str, hash: str) -> bool:
    return passwd_context.verify(password, hash)


def create_token(
    user_data: dict,
    type: Token_type = "access",
    expiry: timedelta = None,
    refresh: bool = False,
) -> str:
    payload = {}

    payload["user"] = user_data
    payload["exp"] = (
        datetime.now() + (expiry if expiry else ACCESS_DEFAULT_EXPIRE)
        if type == "access"
        else datetime.now() + (expiry if expiry else REFRESH_DEFAULT_EXPIRE)
    )
    payload["jti"] = str(uuid.uuid4())  # Unique identifier for the token
    payload["refresh"] = refresh

    token = jwt.encode(
        payload=payload, key=Config.JWT_SECRET_KEY, algorithm=Config.JWT_ALGORITHM
    )

    return token


def decode_token(token: str) -> dict:
    try:
        token_data = jwt.decode(
            jwt=token, key=Config.JWT_SECRET_KEY, algorithms=[Config.JWT_ALGORITHM]
        )

        return token_data
    except jwt.PyJWTError as e:
        logging.exception(e)
        return None
