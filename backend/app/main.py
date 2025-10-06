"""
Main FastAPI application for The Islamic Guidance Station
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException

from .config import settings
from .database import create_database_pool, close_database_pool
from .routers import quran, prayer, mosque, dhikr

app = FastAPI(
    title="The Islamic Guidance Station",
    description="A unified platform for Quran search, prayer times, and spiritual guidance",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,  # Use configured origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(quran.router, prefix="/api/quran", tags=["Quran"])
app.include_router(prayer.router, prefix="/api/prayer", tags=["Prayer"])
app.include_router(mosque.router, prefix="/api/mosque", tags=["Mosque"])
app.include_router(dhikr.router, prefix="/api/dhikr", tags=["Dhikr"])

# Exception handlers will be added after utils module is properly imported
# For now, using default FastAPI exception handling


@app.on_event("startup")
async def startup_event():
    """Initialize database pool and load schema on startup"""
    try:
        await create_database_pool()
        print("✅ Database pool initialized successfully")

        # Load database schema if needed
        try:
            from pathlib import Path
            schema_dir = Path(__file__).parent.parent.parent / "database" / "schema"

            # Check if tables exist, if not load schema
            from .database import execute_query_single
            result = await execute_query_single(
                "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'surahs')"
            )

            if result and not result.get('exists'):
                print("📊 Loading database schema...")
                schema_files = ['tables.sql', 'init.sql', 'indexes.sql', 'functions.sql']

                for schema_file in schema_files:
                    schema_path = schema_dir / schema_file
                    if schema_path.exists():
                        with open(schema_path, 'r', encoding='utf-8') as f:
                            schema_sql = f.read()
                            from .database import load_schema
                            await load_schema(schema_sql)
                        print(f"   ✓ Loaded {schema_file}")

                print("✅ Database schema loaded successfully")
            else:
                print("✅ Database schema already exists")

        except Exception as schema_error:
            print(f"⚠️  Warning: Schema loading skipped: {schema_error}")

    except Exception as e:
        print(f"⚠️  Warning: Failed to connect to database: {e}")
        print("⚠️  Server will start but database operations will fail")


@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    try:
        await close_database_pool()
        print("✅ Database pool closed successfully")
    except Exception as e:
        print(f"⚠️  Warning: Error closing database pool: {e}")


@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to The Islamic Guidance Station"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
