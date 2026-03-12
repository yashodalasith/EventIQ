from functools import lru_cache

from bson import ObjectId
from pymongo import MongoClient
from pymongo.database import Database

from app.core.config import settings


@lru_cache(maxsize=1)
def get_client() -> MongoClient:
    return MongoClient(settings.mongo_uri)


@lru_cache(maxsize=1)
def get_database() -> Database:
    return get_client()[settings.mongo_db_name]


def to_object_id(value: str) -> ObjectId:
    if not ObjectId.is_valid(value):
        raise ValueError("Invalid id format")
    return ObjectId(value)
