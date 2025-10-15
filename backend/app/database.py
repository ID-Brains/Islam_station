"""
Database connection and pool management for raw SQL operations
"""

import asyncpg
import logfire
from typing import Optional, Any, Dict, List
from contextlib import asynccontextmanager

from .config import settings


_pool: Optional[asyncpg.Pool] = None


async def create_database_pool() -> None:
    """Create asyncpg connection pool with logging"""
    global _pool
    if _pool is None:
        try:
            _pool = await asyncpg.create_pool(
                settings.DATABASE_URL,
                min_size=5,
                max_size=settings.DATABASE_POOL_SIZE,
                max_queries=50000,
                max_inactive_connection_lifetime=300.0,
                statement_cache_size=0,
            )
            logfire.info(
                "Database pool created",
                pool_size=settings.DATABASE_POOL_SIZE,
                min_size=5,
            )
        except Exception:
            logfire.exception("Failed to create database pool")
            raise


async def close_database_pool() -> None:
    """Close database connection pool"""
    global _pool
    if _pool:
        try:
            await _pool.close()
            logfire.info("Database pool closed")
        except Exception:
            logfire.exception("Error closing database pool")
            raise
        finally:
            _pool = None


@asynccontextmanager
async def get_connection():
    """Get database connection from pool"""
    if _pool is None:
        raise RuntimeError("Database pool not initialized")

    async with _pool.acquire() as conn:
        yield conn


async def execute_query(query: str, *args) -> List[Dict[str, Any]]:
    """Execute raw SQL query and return results as dicts"""
    async with get_connection() as conn:
        rows = await conn.fetch(query, *args)
        return [dict(row) for row in rows]


async def execute_query_single(query: str, *args) -> Optional[Dict[str, Any]]:
    """Execute query and return single result"""
    async with get_connection() as conn:
        row = await conn.fetchrow(query, *args)
        return dict(row) if row else None


async def execute_command(query: str, *args) -> str:
    """Execute command (INSERT, UPDATE, DELETE) and return status"""
    async with get_connection() as conn:
        result = await conn.execute(query, *args)
        return result


async def load_schema(schema_sql: str) -> None:
    """Load database schema from SQL string"""
    async with get_connection() as conn:
        await conn.execute(schema_sql)
