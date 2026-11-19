from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.security import validate_password_strength


class RegisterRequest(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=120, examples=["Rohan Kulkarni"])
    farm_name: str = Field(..., min_length=2, max_length=150, examples=["GreenValley Agro Farm"])
    email: EmailStr = Field(..., examples=["rohan@greenvalley.in"])
    password: str = Field(..., min_length=8, max_length=72, examples=["Farm@2026"])

    @field_validator("full_name", "farm_name")
    @classmethod
    def clean_non_empty_text(cls, value: str) -> str:
        cleaned = " ".join(value.strip().split())
        if len(cleaned) < 2:
            raise ValueError("Must be at least 2 valid characters long.")
        return cleaned

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()

    @field_validator("password")
    @classmethod
    def check_password_rules(cls, value: str) -> str:
        return validate_password_strength(value)


class LoginRequest(BaseModel):
    email: EmailStr = Field(..., examples=["demo@smartfarm.ai"])
    password: str = Field(..., min_length=1, max_length=72, examples=["Demo@1234"])

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> str:
        return str(value).strip().lower()


class UserResponse(BaseModel):
    id: UUID
    full_name: str
    farm_name: str
    email: str
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthTokenResponse(BaseModel):
    success: bool = True
    message: str
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int
    user: UserResponse