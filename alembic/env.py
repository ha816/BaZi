import asyncio
import os
import tomllib
from logging.config import fileConfig
from pathlib import Path

from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context
from kkachi.adapter.outer.db.models import Base

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata

_LOCAL_TOML = Path(__file__).resolve().parent.parent / "src" / "kkachi" / "resource" / "local.toml"
_DEFAULT_DB_URL = "postgresql+asyncpg://bazi:bazi@localhost:5432/bazi"


def _get_db_url() -> str:
    """KKACHI_DB_URL 환경변수 → local.toml [db].url → 기본값 순. 앱(fastapi.py)과 같은 우선순위."""
    env_url = os.getenv("KKACHI_DB_URL")
    if env_url:
        return env_url
    if _LOCAL_TOML.exists():
        with open(_LOCAL_TOML, "rb") as f:
            return tomllib.load(f)["db"]["url"]
    return _DEFAULT_DB_URL


def run_migrations_offline() -> None:
    context.configure(
        url=_get_db_url(),
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = create_async_engine(_get_db_url())
    async with engine.connect() as connection:
        await connection.run_sync(
            lambda conn: context.configure(connection=conn, target_metadata=target_metadata)
        )
        async with connection.begin():
            await connection.run_sync(lambda _: context.run_migrations())
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
