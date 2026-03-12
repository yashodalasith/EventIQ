import logging
import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


def _parse_bool(value: str | None, default: bool) -> bool:
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on"}


class Settings:
    def __init__(self) -> None:
        self.port = int(os.getenv("PORT", "8001"))
        self.app_env = os.getenv("APP_ENV", os.getenv("NODE_ENV", "development"))
        self.mongo_uri = os.getenv("MONGO_URI", "mongodb://localhost:27017")
        self.mongo_db_name = os.getenv("MONGO_DB_NAME", "resource_db")
        self.event_service_url = os.getenv(
            "EVENT_SERVICE_URL",
            "http://localhost:8081",
        ).rstrip("/")
        self.auth_service_url = os.getenv(
            "AUTH_SERVICE_URL",
            "http://localhost:4001",
        ).rstrip("/")
        self.kafka_bootstrap_servers = os.getenv(
            "KAFKA_BOOTSTRAP_SERVERS",
            "localhost:9092",
        )
        self.kafka_resource_allocation_topic = os.getenv(
            "KAFKA_RESOURCE_ALLOCATION_TOPIC",
            "resource-allocation",
        )
        self.cors_origin = os.getenv("CORS_ORIGIN", "http://localhost:5173")
        self.jwt_secret = os.getenv("JWT_SECRET", "change-me")
        self.jwt_algorithm = os.getenv("JWT_ALGORITHM", "HS256")
        self.rate_limit_window_seconds = int(
            os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"),
        )
        self.rate_limit_max_requests = int(
            os.getenv("RATE_LIMIT_MAX_REQUESTS", "120"),
        )
        self.http_timeout_seconds = float(os.getenv("HTTP_TIMEOUT_SECONDS", "6"))
        self.log_level = os.getenv("LOG_LEVEL", "INFO").upper()


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    settings = Settings()
    logging.basicConfig(
        level=getattr(logging, settings.log_level, logging.INFO),
        format="%(asctime)s %(levelname)s [resource-service] %(message)s",
    )
    return settings


settings = get_settings()
