"""Run all DB migrations and verify connectivity."""
import asyncio
import asyncpg
import os
import pathlib
from dotenv import load_dotenv

load_dotenv()

async def main():
    dsn = os.environ.get("DATABASE_URL")
    print("Connecting to PostgreSQL...")
    conn = await asyncpg.connect(dsn=dsn, ssl="require")
    version = await conn.fetchval("SELECT version()")
    print("Connected:", version[:80])
    
    # Run migrations in order
    mig_dir = pathlib.Path("services/api/migrations")
    for sql_file in sorted(mig_dir.glob("*.sql")):
        print(f"Running {sql_file.name}...")
        sql = sql_file.read_text(encoding="utf-8")
        try:
            await conn.execute(sql)
            print(f"  OK: {sql_file.name}")
        except Exception as e:
            print(f"  Note: {sql_file.name}: {e}")
    
    # List tables
    tables = await conn.fetch(
        "SELECT table_name FROM information_schema.tables "
        "WHERE table_schema = 'public' ORDER BY table_name"
    )
    print("Tables created:", [r["table_name"] for r in tables])
    await conn.close()
    print("Done!")

asyncio.run(main())
