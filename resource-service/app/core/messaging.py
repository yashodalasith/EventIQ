import json
import logging
from functools import lru_cache

from kafka import KafkaProducer

from app.core.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_producer() -> KafkaProducer:
    return KafkaProducer(
        bootstrap_servers=settings.kafka_bootstrap_servers,
        value_serializer=lambda value: json.dumps(value).encode("utf-8"),
    )


def publish_resource_allocation(payload: dict) -> None:
    try:
        producer = get_producer()
        producer.send(settings.kafka_resource_allocation_topic, payload)
        producer.flush()
    except Exception as exc:  # pragma: no cover - external infra failure path
        logger.exception(
            "Failed to publish resource allocation event",
            extra={"error": str(exc), "payload": payload},
        )
