import os
from dotenv import load_dotenv

load_dotenv()

PORT = int(os.getenv("PORT", "8000"))
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://eventiq:eventiq@localhost:5432/resource_db")
AUTH_SERVICE_URL = os.getenv("AUTH_SERVICE_URL", "http://localhost:4001")
KAFKA_BOOTSTRAP_SERVERS = os.getenv("KAFKA_BOOTSTRAP_SERVERS", "localhost:9092")
CORS_ORIGIN = os.getenv("CORS_ORIGIN", "http://localhost:5173")
JWT_SECRET = os.getenv("JWT_SECRET", "change-me")
