import sys
from pathlib import Path
import uuid

from sqlalchemy import create_engine, text

# Ensure backend root is importable
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import get_settings
from app.core.security import hash_password

DEMO_EMAIL = "demo@smartfarm.ai"
DEMO_PASSWORD = "Demo@1234"
DEMO_FULL_NAME = "Aarav Deshmukh"
DEMO_FARM_NAME = "Sahyadri Precision Farms"

TENANT_SCOPED_TABLES = [
    "crops",
    "produce_inventory",
    "inventory_items",
    "leaf_predictions",
    "predictions",
    "weather_observations",
    "weather_records",
    "chat_sessions",
]


def run_migration() -> None:
    settings = get_settings()
    if not settings.DATABASE_URL:
        raise RuntimeError("DATABASE_URL is missing in backend/.env")

    engine = create_engine(settings.DATABASE_URL)

    with engine.begin() as conn:
        print("1. Creating 'users' table if not exists...")
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id UUID PRIMARY KEY,
                    full_name VARCHAR(120) NOT NULL,
                    farm_name VARCHAR(150) NOT NULL,
                    email VARCHAR(255) NOT NULL UNIQUE,
                    hashed_password TEXT NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
                );
                """
            )
        )
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_users_email ON users (email);"))

        print(f"2. Seeding default demo account ({DEMO_EMAIL})...")
        existing = conn.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": DEMO_EMAIL},
        ).fetchone()

        if existing:
            demo_user_id = str(existing[0])
            print(f"   -> Demo user already exists (id={demo_user_id})")
        else:
            demo_user_id = str(uuid.uuid4())
            conn.execute(
                text(
                    """
                    INSERT INTO users (id, full_name, farm_name, email, hashed_password, is_active)
                    VALUES (:id, :full_name, :farm_name, :email, :hashed_password, TRUE)
                    """
                ),
                {
                    "id": demo_user_id,
                    "full_name": DEMO_FULL_NAME,
                    "farm_name": DEMO_FARM_NAME,
                    "email": DEMO_EMAIL,
                    "hashed_password": hash_password(DEMO_PASSWORD),
                },
            )
            print(f"   -> Created demo user (id={demo_user_id})")

        print("3. Adding user_id multi-tenant isolation to domain tables...")
        existing_tables_rows = conn.execute(
            text(
                """
                SELECT table_name
                FROM information_schema.tables
                WHERE table_schema = 'public'
                """
            )
        ).fetchall()
        existing_tables = {row[0] for row in existing_tables_rows}

        migrated_tables = []
        for table in TENANT_SCOPED_TABLES:
            if table not in existing_tables:
                continue

            col_exists = conn.execute(
                text(
                    """
                    SELECT 1
                    FROM information_schema.columns
                    WHERE table_schema = 'public'
                      AND table_name = :table
                      AND column_name = 'user_id'
                    """
                ),
                {"table": table},
            ).fetchone()

            if not col_exists:
                conn.execute(
                    text(
                        f"""
                        ALTER TABLE {table}
                        ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE
                        """
                    )
                )

            # Backfill any existing rows to demo_user_id
            updated = conn.execute(
                text(f"UPDATE {table} SET user_id = :uid WHERE user_id IS NULL"),
                {"uid": demo_user_id},
            ).rowcount

            # Enforce NOT NULL & create index
            conn.execute(text(f"ALTER TABLE {table} ALTER COLUMN user_id SET NOT NULL"))
            conn.execute(
                text(f"CREATE INDEX IF NOT EXISTS ix_{table}_user_id ON {table} (user_id)")
            )
            migrated_tables.append((table, updated))

        print("\nMigration Summary:")
        for tbl, count in migrated_tables:
            print(f" - {tbl}: user_id enforced & indexed ({count} existing row(s) linked to demo account)")
        print(f"\nDemo Credentials -> Email: {DEMO_EMAIL} | Password: {DEMO_PASSWORD}")


if __name__ == "__main__":
    run_migration()