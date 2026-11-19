from uuid import UUID
from fastapi import Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.exceptions import AppException
from app.core.security import decode_access_token
from app.models.user import User

try:
    from app.db.session import get_db
except ImportError:
    from app.db.database import get_db

bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer" or not credentials.credentials:
        raise AppException(
            message="Authentication required. Please sign in to access this resource.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="AUTH_REQUIRED",
        )

    payload = decode_access_token(credentials.credentials)

    try:
        user_id = UUID(str(payload["sub"]))
    except ValueError as exc:
        raise AppException(
            message="Invalid user identifier in authentication token.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="INVALID_TOKEN",
        ) from exc

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise AppException(
            message="User account no longer exists. Please register or sign in again.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="USER_NOT_FOUND",
        )

    if not user.is_active:
        raise AppException(
            message="Your account has been deactivated. Contact support.",
            status_code=status.HTTP_403_FORBIDDEN,
            code="ACCOUNT_DISABLED",
        )

    return user