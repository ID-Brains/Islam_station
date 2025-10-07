"""
Health check router for The Islamic Guidance Station
"""

import time
import asyncio
from typing import Dict, Any
from datetime import datetime

from fastapi import APIRouter, HTTPException, status
from fastapi.responses import JSONResponse

from ..config import settings
from ..database import get_connection, _pool

router = APIRouter()


async def check_database() -> Dict[str, Any]:
    """Check database connectivity"""
    try:
        start_time = time.time()

        # Try to get a connection and execute a simple query
        async with get_connection() as conn:
            await conn.fetchval("SELECT 1")

        response_time = time.time() - start_time

        # Get pool information
        pool_info = {}
        if _pool:
            pool_info = {
                "size": _pool.get_size(),
                "min_size": _pool.get_min_size(),
                "max_size": _pool.get_max_size(),
            }

        return {
            "status": "healthy",
            "response_time_ms": round(response_time * 1000, 2),
            "pool_info": pool_info,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }


def check_system() -> Dict[str, Any]:
    """Check system resources"""
    try:
        # Try to import psutil, fallback if not available
        try:
            import psutil

            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)

            # Memory usage
            memory = psutil.virtual_memory()

            # Disk usage
            disk = psutil.disk_usage("/")

            return {
                "status": "healthy",
                "cpu_percent": cpu_percent,
                "memory": {
                    "total_gb": round(memory.total / (1024**3), 2),
                    "available_gb": round(memory.available / (1024**3), 2),
                    "used_percent": memory.percent,
                },
                "disk": {
                    "total_gb": round(disk.total / (1024**3), 2),
                    "free_gb": round(disk.free / (1024**3), 2),
                    "used_percent": round((disk.used / disk.total) * 100, 2),
                },
                "timestamp": datetime.utcnow().isoformat(),
            }
        except ImportError:
            return {
                "status": "healthy",
                "message": "psutil not available for detailed system metrics",
                "timestamp": datetime.utcnow().isoformat(),
            }

    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }


def check_application() -> Dict[str, Any]:
    """Check application-specific health"""
    try:
        # Check if essential configuration is set
        config_checks = {
            "database_url": bool(settings.DATABASE_URL),
            "secret_key": bool(settings.SECRET_KEY),
            "rate_limit_enabled": settings.RATE_LIMIT_ENABLED,
            "metrics_enabled": settings.METRICS_ENABLED,
            "health_check_enabled": settings.HEALTH_CHECK_ENABLED,
        }

        # Check if PyArabic is available
        pyarabic_available = False
        try:
            from ..utils.arabic_text import is_pyarabic_available

            pyarabic_available = is_pyarabic_available()
        except ImportError:
            pyarabic_available = False

        return {
            "status": "healthy",
            "configuration": config_checks,
            "pyarabic_available": pyarabic_available,
            "debug_mode": settings.DEBUG,
            "app_name": settings.APP_NAME,
            "timestamp": datetime.utcnow().isoformat(),
        }

    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat(),
        }


async def check_external_services() -> Dict[str, Any]:
    """Check external service connectivity"""
    services = {}

    # Check Nominatim API
    try:
        import httpx

        start_time = time.time()

        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(
                f"{settings.NOMINATIM_API_BASE}/search",
                params={"q": "test", "format": "json", "limit": 1},
                headers={"User-Agent": "IslamStation/1.0"},
            )

        response_time = time.time() - start_time

        services["nominatim"] = {
            "status": "healthy" if response.status_code == 200 else "unhealthy",
            "response_time_ms": round(response_time * 1000, 2),
            "status_code": response.status_code,
        }

    except Exception as e:
        services["nominatim"] = {
            "status": "unhealthy",
            "error": str(e),
        }

    return {
        "services": services,
        "timestamp": datetime.utcnow().isoformat(),
    }


@router.get("/")
async def health_check():
    """
    Basic health check endpoint
    Returns overall application health status
    """
    if not settings.HEALTH_CHECK_ENABLED:
        return JSONResponse(
            status_code=200,
            content={
                "status": "disabled",
                "message": "Health checks are disabled",
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    try:
        # Run all health checks concurrently
        database_task = asyncio.create_task(check_database())
        system_task = asyncio.create_task(asyncio.to_thread(check_system))
        application_task = asyncio.create_task(asyncio.to_thread(check_application))
        external_task = asyncio.create_task(check_external_services())

        # Wait for all checks to complete
        database, system, application, external = await asyncio.gather(
            database_task,
            system_task,
            application_task,
            external_task,
            return_exceptions=True,
        )

        # Determine overall status
        checks = {
            "database": (
                database
                if not isinstance(database, Exception)
                else {"status": "unhealthy", "error": str(database)}
            ),
            "system": (
                system
                if not isinstance(system, Exception)
                else {"status": "unhealthy", "error": str(system)}
            ),
            "application": (
                application
                if not isinstance(application, Exception)
                else {"status": "unhealthy", "error": str(application)}
            ),
            "external_services": (
                external
                if not isinstance(external, Exception)
                else {"status": "unhealthy", "error": str(external)}
            ),
        }

        # Overall status is unhealthy if any critical check is unhealthy
        critical_checks = ["database", "application"]
        overall_status = "healthy"

        for check_name in critical_checks:
            if checks[check_name].get("status") != "healthy":
                overall_status = "unhealthy"
                break

        status_code = 200 if overall_status == "healthy" else 503

        return JSONResponse(
            status_code=status_code,
            content={
                "status": overall_status,
                "checks": checks,
                "timestamp": datetime.utcnow().isoformat(),
            },
        )

    except Exception as e:
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            },
        )


@router.get("/db")
async def database_health():
    """
    Database health check endpoint
    Returns database connectivity and performance metrics
    """
    if not settings.HEALTH_CHECK_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Health checks are disabled",
        )

    db_health = await check_database()
    status_code = 200 if db_health.get("status") == "healthy" else 503

    return JSONResponse(status_code=status_code, content=db_health)


@router.get("/system")
async def system_health():
    """
    System health check endpoint
    Returns system resource usage metrics
    """
    if not settings.HEALTH_CHECK_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Health checks are disabled",
        )

    sys_health = check_system()
    status_code = 200 if sys_health.get("status") == "healthy" else 503

    return JSONResponse(status_code=status_code, content=sys_health)


@router.get("/application")
async def application_health():
    """
    Application health check endpoint
    Returns application configuration and dependency status
    """
    if not settings.HEALTH_CHECK_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Health checks are disabled",
        )

    app_health = check_application()
    status_code = 200 if app_health.get("status") == "healthy" else 503

    return JSONResponse(status_code=status_code, content=app_health)


@router.get("/external")
async def external_services_health():
    """
    External services health check endpoint
    Returns external service connectivity status
    """
    if not settings.HEALTH_CHECK_ENABLED:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Health checks are disabled",
        )

    external_health = await check_external_services()

    return JSONResponse(status_code=200, content=external_health)
