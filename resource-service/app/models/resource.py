from sqlalchemy import Column, DateTime, Integer, String
from app.core.db import Base


class Resource(Base):
    __tablename__ = "resources"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    type = Column(String(60), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)


class Allocation(Base):
    __tablename__ = "allocations"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(120), nullable=False)
    resource_name = Column(String(120), nullable=False)
    quantity = Column(Integer, nullable=False)
    allocated_to = Column(String(120), nullable=False)
    allocated_at = Column(DateTime(timezone=True), nullable=False)
