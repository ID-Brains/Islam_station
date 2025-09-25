"""
Main FastAPI application for The Islamic Guidance Station
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import create_database_pool, close_database_pool
from .routers import quran
# from .routers import prayer, mosque, dhikr  # TODO: Implement these routers

app = FastAPI(
    title="The Islamic Guidance Station",
    description="A unified platform for Quran search, prayer times, and spiritual guidance",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    # allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(quran.router, prefix="/api/quran", tags=["Quran"])
# app.include_router(prayer.router, prefix="/api/prayer", tags=["Prayer"])  # TODO: Implement prayer router
# app.include_router(mosque.router, prefix="/api/mosque", tags=["Mosque"])  # TODO: Implement mosque router
# app.include_router(dhikr.router, prefix="/api/dhikr", tags=["Dhikr"])  # TODO: Implement dhikr router

@app.on_event("startup")
async def startup_event():
    """Initialize database pool and load schema on startup"""
    await create_database_pool()
    # TODO: Load schema from database engineer

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connections on shutdown"""
    await close_database_pool()

@app.get("/")
async def root():
    """Root endpoint"""
    return {"message": "Welcome to The Islamic Guidance Station"}


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
