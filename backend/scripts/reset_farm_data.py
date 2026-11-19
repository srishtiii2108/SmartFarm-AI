import sys
from pathlib import Path
import uuid
from sqlalchemy import create_engine, text

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import get_settings
from app.core.security import hash_password

TABLES_TO_CLEAR = [
    "produce_inventory",
    "predictions",
    "weather_records",
    "crops",
    "chat_history",
    "users",
]

DEMO_EMAIL = "demo@smartfarm.ai"
DEMO_PASSWORD = "Demo@1234"


def reset_database() -> None:
    settings = get_settings()
    if not settings.DATABASE_URL:
        raise RuntimeError("DATABASE_URL is missing in backend/.env")

    engine = create_engine(settings.DATABASE_URL)

    with engine.begin() as conn:
        existing_rows = conn.execute(
            text(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                """
            )
        ).fetchall()
        existing_tables = {row[0] for row in existing_rows}

        targets = [t for t in TABLES_TO_CLEAR if t in existing_tables]
        if targets:
            joined = ", ".join(targets)
            conn.execute(text(f"TRUNCATE TABLE {joined} RESTART IDENTITY CASCADE;"))
            print(f"Cleared tables: {joined}")

        # Seed a fresh empty demo account so the Login page's Demo button stays valid
        demo_id = str(uuid.uuid4())
        conn.execute(
            text(
                """
                INSERT INTO users (id, full_name, farm_name, email, hashed_password, is_active)
                VALUES (:id, :full_name, :farm_name, :email, :hashed_password, TRUE)
                """
            ),
            {
                "id": demo_id,
                "full_name": "Aarav Deshmukh",
                "farm_name": "Sahyadri Precision Farms",
                "email": DEMO_EMAIL,
                "hashed_password": hash_password(DEMO_PASSWORD),
            },
        )

        rag_docs = 0
        if "knowledge_documents" in existing_tables:
            rag_docs = conn.execute(text("SELECT COUNT(*) FROM knowledge_documents")).scalar() or 0

        print(f"Preserved shared RAG knowledge base: {rag_docs} indexed document(s)")
        print(f"Fresh Demo User ready -> {DEMO_EMAIL} / {DEMO_PASSWORD} (0 records)")


if __name__ == "__main__":
    reset_database()