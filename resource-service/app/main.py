import logging
import time
from collections import defaultdict, deque

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pymongo.errors import PyMongoError

from app.api.routes import router
from app.core.config import settings
from app.core.db import get_database

logger = logging.getLogger(__name__)
rate_limit_buckets: dict[str, deque[float]] = defaultdict(deque)

app = FastAPI(title="EventIQ Resource Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.cors_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup() -> None:
    try:
        get_database().command("ping")
        logger.info("Resource service connected to MongoDB")
    except PyMongoError as exc:
        logger.exception("Failed to connect to MongoDB", extra={"error": str(exc)})
        raise


@app.middleware("http")
async def rate_limit_and_log(request: Request, call_next):
    if request.url.path == "/health":
        return await call_next(request)

    client_host = request.client.host if request.client else "unknown"
    now = time.time()
    bucket = rate_limit_buckets[client_host]
    window_start = now - settings.rate_limit_window_seconds

    while bucket and bucket[0] < window_start:
        bucket.popleft()

    if len(bucket) >= settings.rate_limit_max_requests:
        return JSONResponse(
            status_code=429,
            content={"detail": "Rate limit exceeded"},
        )

    bucket.append(now)
    started_at = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - started_at) * 1000, 2)
    logger.info(
        "%s %s -> %s in %sms",
        request.method,
        request.url.path,
        response.status_code,
        duration_ms,
    )
    return response


app.include_router(router)


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "service": "resource",
        "environment": settings.app_env,
        "database": "mongodb",
    }
