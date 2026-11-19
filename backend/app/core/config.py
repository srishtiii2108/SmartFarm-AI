from functools import lru_cache
from typing import List
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "SmartFarm AI API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"

    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173"

    # Database & Storage
    DATABASE_URL: str = ""
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    SUPABASE_BUCKET: str = "leaf-scans"

    # Authentication & JWT Security
    JWT_SECRET_KEY: str = "smartfarm-ai-super-secret-jwt-key-change-in-prod-2026"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Cohere Generative AI & Embeddings
    COHERE_API_KEY: str = ""
    COHERE_CHAT_MODEL: str = "command-a-03-2025"
    COHERE_EMBED_MODEL: str = "embed-english-v3.0"

    # ML Configuration
    ML_MODEL_PATH: str = "../ml/artifacts/smartfarm_mobilenetv2_v1.keras"
    ML_LABELS_PATH: str = "../ml/artifacts/class_indices.json"
    ML_MODEL_VERSION: str = "mobilenetv2-v1.0"

    @field_validator("SUPABASE_URL", "SUPABASE_KEY", "SUPABASE_BUCKET", mode="before")
    @classmethod
    def sanitize_supabase_env(cls, value: str) -> str:
        if not isinstance(value, str):
            return ""
        return value.strip().strip('"').strip("'").strip()

    @property
    def normalized_supabase_url(self) -> str:
        return self.SUPABASE_URL.rstrip("/")

    @property
    def supabase_key_format(self) -> str:
        key = self.SUPABASE_KEY
        if not key:
            return "missing"
        if key.startswith("sb_secret_"):
            return "secret_v2"
        if key.startswith("eyJ") and key.count(".") == 2:
            return "legacy_jwt"
        if key.startswith("sb_publishable_"):
            return "publishable_invalid_for_backend"
        if key.startswith("sbp_"):
            return "personal_access_token_invalid"
        return "unrecognized"

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()