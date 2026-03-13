import json
import logging
from functools import lru_cache

from kafka import KafkaProducer

from app.core.config import settings

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_producer() -> KafkaProducer:
    producer_kwargs: dict = {
        "bootstrap_servers": settings.kafka_bootstrap_servers,
        "value_serializer": lambda value: json.dumps(value).encode("utf-8"),
        "security_protocol": settings.kafka_security_protocol,
    }

    if settings.kafka_security_protocol.startswith("SASL"):
        producer_kwargs["sasl_mechanism"] = settings.kafka_sasl_mechanism
        producer_kwargs["sasl_plain_username"] = settings.kafka_sasl_username
        producer_kwargs["sasl_plain_password"] = settings.kafka_sasl_password

    if settings.kafka_security_protocol in {"SSL", "SASL_SSL"}:
        producer_kwargs["ssl_check_hostname"] = settings.kafka_ssl_check_hostname
        if settings.kafka_ssl_cafile:
            producer_kwargs["ssl_cafile"] = settings.kafka_ssl_cafile

    return KafkaProducer(**producer_kwargs)


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
