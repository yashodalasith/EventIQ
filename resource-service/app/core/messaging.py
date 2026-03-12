from kafka import KafkaProducer
import json
from app.core.config import KAFKA_BOOTSTRAP_SERVERS

producer = KafkaProducer(
    bootstrap_servers=KAFKA_BOOTSTRAP_SERVERS,
    value_serializer=lambda v: json.dumps(v).encode("utf-8")
)


def publish(topic: str, payload: dict):
    producer.send(topic, payload)
    producer.flush()
