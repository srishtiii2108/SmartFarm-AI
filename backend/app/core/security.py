from datetime import datetime, timedelta, timezone
import re
from typing import Any, Dict, Optional

import bcrypt
from fastapi import status
import jwt
from jwt.exceptions import ExpiredSignatureError, InvalidTokenError

from app.core.config import get_settings
from app.core.exceptions import AppException

PASSWORD_SPECIAL_REGEX = re.compile(r"[!@#$%^&*(),.?\":{}|<>_\-+=\[\]\\\/~`]")


def validate_password_strength(password: str) -> str:
    """Enforce production-grade password complexity rules."""
    if not password or len(password) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    if len(password) > 72:
        raise ValueError("Password must not exceed 72 characters.")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must include at least one uppercase letter (A-Z).")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must include at least one lowercase letter (a-z).")
    if not re.search(r"\d", password):
        raise ValueError("Password must include at least one number (0-9).")
    if not PASSWORD_SPECIAL_REGEX.search(password):
        raise ValueError("Password must include at least one special character (@, #, $, !, %, *, ?, &).")
    return password


def hash_password(plain_password: str) -> str:
    """Hash a plaintext password with a random bcrypt salt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(plain_password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Constant-time password verification using bcrypt."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(subject: str, extra_claims: Optional[Dict[str, Any]] = None) -> str:
    """Generate a signed HS256 JWT access token."""
    settings = get_settings()
    now = datetime.now(timezone.utc)
    expire = now + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
        "type": "access",
    }
    if extra_claims:
        payload.update(extra_claims)

    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> Dict[str, Any]:
    """Decode and validate a JWT access token."""
    settings = get_settings()
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        if not payload.get("sub"):
            raise AppException(
                message="Invalid authentication token payload.",
                status_code=status.HTTP_401_UNAUTHORIZED,
                code="INVALID_TOKEN",
            )
        return payload
    except ExpiredSignatureError as exc:
        raise AppException(
            message="Your session has expired. Please sign in again.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="TOKEN_EXPIRED",
        ) from exc
    except InvalidTokenError as exc:
        raise AppException(
            message="Invalid or malformed authentication token.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="INVALID_TOKEN",
        ) from exc