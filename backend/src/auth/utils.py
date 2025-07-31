from passlib.context import CryptContext
from src.config import Config
from datetime import timedelta, datetime, timezone
from typing import Literal
import jwt
import uuid
import logging

Token_type = Literal["access", "refresh"]

ACCESS_DEFAULT_EXPIRE = timedelta(minutes=180)
REFRESH_DEFAULT_EXPIRE = timedelta(days=7)

passwd_context = CryptContext(schemes=["bcrypt"])


def get_utc_now() -> datetime:
    """Get current UTC time with timezone info"""
    return datetime.now(timezone.utc)


def get_exp_time(token_type: Token_type, expiry: timedelta = None) -> datetime:
    """Get expiration time for token with explicit UTC timezone"""
    if token_type == "access":
        delta = expiry if expiry else ACCESS_DEFAULT_EXPIRE
    else:
        delta = expiry if expiry else REFRESH_DEFAULT_EXPIRE

    return get_utc_now() + delta


def is_token_expired(exp_timestamp: float) -> bool:
    """Check if token is expired using UTC timezone"""
    current_time = get_utc_now()
    exp_time = datetime.fromtimestamp(exp_timestamp, tz=timezone.utc)
    return current_time >= exp_time


def generate_passwd_hash(password: str) -> str:
    hash = passwd_context.hash(password)
    return hash


def verify_password(password: str, hash: str) -> bool:
    return passwd_context.verify(password, hash)


def create_token(
    data: dict,
    type: Token_type = "access",
    expiry: timedelta = None,
) -> str:
    payload = {}

    payload["data"] = data
    payload["exp"] = get_exp_time(type, expiry)
    payload["jti"] = str(uuid.uuid4())  # Unique identifier for the token
    payload["type"] = type

    if type == "access":
        token = jwt.encode(
            payload=payload, key=Config.JWT_SECRET_KEY, algorithm=Config.JWT_ALGORITHM
        )
    else:
        token = jwt.encode(
            payload=payload,
            key=Config.JWT_SECRET_KEY_REFRESH,
            algorithm=Config.JWT_ALGORITHM,
        )

    return token


def decode_token(token: str, type: Token_type = "access") -> dict:
    try:
        if type == "access":
            token_data = jwt.decode(
                jwt=token,
                key=Config.JWT_SECRET_KEY,
                algorithms=[Config.JWT_ALGORITHM],
                # Explicitly set timezone for exp validation
                options={"verify_exp": True},
            )
        else:
            token_data = jwt.decode(
                jwt=token,
                key=Config.JWT_SECRET_KEY_REFRESH,
                algorithms=[Config.JWT_ALGORITHM],
                # Explicitly set timezone for exp validation
                options={"verify_exp": True},
            )

        # Double-check expiration with our explicit UTC timezone validation
        if is_token_expired(token_data["exp"]):
            logging.warning(
                f"Token expired at {datetime.fromtimestamp(token_data['exp'], tz=timezone.utc)}"
            )
            return None

        return token_data
    except jwt.ExpiredSignatureError:
        logging.warning("Token has expired (JWT validation)")
        return None
    except jwt.PyJWTError as e:
        logging.exception(e)
        return None

def extract_jti_from_token(token: str, type: Token_type = "access") -> str:
    """Extract JTI (JWT ID) from token without full validation"""
    try:
        if type == "access":
            # Decode without verification to extract JTI
            unverified_payload = jwt.decode(
                jwt=token,
                key=Config.JWT_SECRET_KEY,
                algorithms=[Config.JWT_ALGORITHM],
                options={"verify_signature": True, "verify_exp": False}
            )
        else:
            unverified_payload = jwt.decode(
                jwt=token,
                key=Config.JWT_SECRET_KEY_REFRESH,
                algorithms=[Config.JWT_ALGORITHM],
                options={"verify_signature": True, "verify_exp": False}
            )
        
        return unverified_payload.get("jti")
    except jwt.PyJWTError as e:
        logging.exception(f"Error extracting JTI from token: {e}")
        return None
