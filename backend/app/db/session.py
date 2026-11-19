import logging
from typing import Generator
from urllib.parse import quote_plus, unquote
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import get_settings

logger = logging.getLogger("smartfarm.db")
settings = get_settings()


def _build_safe_database_url(raw_url: str) -> str:
    if not raw_url:
        return ""
    if raw_url.startswith("postgres://"):
        raw_url = raw_url.replace("postgres://", "postgresql://", 1)

    if "://" in raw_url and "@" in raw_url:
        scheme, rest = raw_url.split("://", 1)
        auth_part, host_part = rest.rsplit("@", 1)
        if ":" in auth_part:
            user, password = auth_part.split(":", 1)
            safe_password = quote_plus(unquote(password))
            return f"{scheme}://{user}:{safe_password}@{host_part}"
    return raw_url


database_url = _build_safe_database_url(settings.DATABASE_URL)

engine = create_engine(
    database_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
) if database_url else None

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine) if engine else None


def get_db() -> Generator[Session, None, None]:
    if SessionLocal is None:
        raise RuntimeError("Database is not configured. Please set DATABASE_URL in .env.")
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    if engine is None:
        logger.warning("DATABASE_URL not set; skipping database initialization.")
        return

    # Import all models so Base.metadata registers every table
    from app.models import Base  # noqa: F401

    with engine.begin() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables and pgvector extension verified/created successfully.")


def check_db_connection() -> bool:
    if engine is None:
        return False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as exc:
        logger.error(f"Database health check failed: {exc}")
        return False