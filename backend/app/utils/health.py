"""
Health check utilities for The Islamic Guidance Station
"""

import time
import asyncio
from typing import Dict, Any
from datetime import datetime

import psutil

from ..config import settings
from ..database import get_connection, _pool


class HealthChecker:
    """Health check utilities"""

    @staticmethod
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
                    "idle_connections": (
                        len(_pool._queue._queue)
                        if hasattr(_pool._queue, "_queue")
                        else "unknown"
                    ),
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

    @staticmethod
    def check_system() -> Dict[str, Any]:
        """Check system resources"""
        try:
            # CPU usage
            cpu_percent = psutil.cpu_percent(interval=1)

            # Memory usage
            memory = psutil.virtual_memory()

            # Disk usage
            disk = psutil.disk_usage("/")

            # Load average (Unix systems)
            load_avg = None
            try:
                load_avg = list(psutil.getloadavg())
            except (AttributeError, OSError):
                # Not available on Windows
                pass

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
                "load_average": load_avg,
                "timestamp": datetime.utcnow().isoformat(),
            }

        except Exception as e:
            return {
                "status": "unhealthy",
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat(),
            }

    @staticmethod
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

    @staticmethod
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

    @staticmethod
    async def get_overall_health() -> Dict[str, Any]:
        """Get overall health status"""
        # Run all health checks concurrently
        database_task = asyncio.create_task(HealthChecker.check_database())
        system_task = asyncio.create_task(asyncio.to_thread(HealthChecker.check_system))
        asyncio.create_task(asyncio.to_thread(HealthChecker.check_application))
        external_task = asyncio.create_task(HealthChecker.check_external_services())

        # Wait for all checks to complete
        database, system, application, external = await asyncio.gather(
            database_task,
            system_task,
            application,
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

        return {
            "status": overall_status,
            "checks": checks,
            "timestamp": datetime.utcnow().isoformat(),
        }


def is_healthy(check_result: Dict[str, Any]) -> bool:
    """Check if a health check result is healthy"""
    return check_result.get("status") == "healthy"


def get_status_code(health_result: Dict[str, Any]) -> int:
    """Get HTTP status code based on health check result"""
    if health_result.get("status") == "healthy":
        return 200
    else:
        return 503  # Service Unavailable


async def health_check_dependency() -> Dict[str, Any]:
    """FastAPI dependency for health checks"""
    if not settings.HEALTH_CHECK_ENABLED:
        return {"status": "disabled", "message": "Health checks are disabled"}

    return await HealthChecker.get_overall_health()


def create_health_response(
    status: str,
    checks: Dict[str, Any] = None,
    message: str = None,
    status_code: int = None,
) -> Dict[str, Any]:
    """Create a standardized health check response"""

    response = {
        "status": status,
        "timestamp": datetime.utcnow().isoformat(),
    }

    if checks:
        response["checks"] = checks

    if message:
        response["message"] = message

    if status_code:
        response["status_code"] = status_code

    return response
