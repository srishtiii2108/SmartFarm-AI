import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import AuthTokenResponse, LoginRequest, RegisterRequest, UserResponse

logger = logging.getLogger("smartfarm.auth")
router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post(
    "/register",
    response_model=AuthTokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new farmer account",
)
def register_user(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise AppException(
            message="An account with this email is already registered. Please sign in instead.",
            status_code=status.HTTP_409_CONFLICT,
            code="EMAIL_ALREADY_EXISTS",
        )

    user = User(
        full_name=payload.full_name,
        farm_name=payload.farm_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    settings = get_settings()
    token = create_access_token(subject=str(user.id), extra_claims={"email": user.email})
    logger.info("Registered new user account (user_id=%s, farm=%s)", user.id, user.farm_name)

    return AuthTokenResponse(
        message="Account created successfully. Welcome to SmartFarm AI!",
        access_token=token,
        expires_in_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=AuthTokenResponse,
    summary="Authenticate farmer & issue JWT access token",
)
def login_user(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthTokenResponse:
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        logger.warning("Failed login attempt for email=%s", payload.email)
        raise AppException(
            message="Invalid email or password.",
            status_code=status.HTTP_401_UNAUTHORIZED,
            code="INVALID_CREDENTIALS",
        )

    if not user.is_active:
        raise AppException(
            message="This account has been deactivated.",
            status_code=status.HTTP_403_FORBIDDEN,
            code="ACCOUNT_DISABLED",
        )

    settings = get_settings()
    token = create_access_token(subject=str(user.id), extra_claims={"email": user.email})
    logger.info("User signed in (user_id=%s)", user.id)

    return AuthTokenResponse(
        message="Signed in successfully.",
        access_token=token,
        expires_in_minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    summary="Get current authenticated farmer profile",
)
def get_me(current_user: User = Depends(get_current_user)) -> dict:
    return {
        "success": True,
        "user": UserResponse.model_validate(current_user),
    }