from datetime import datetime
from pydantic import BaseModel, Field


class ResourceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    type: str = Field(min_length=2, max_length=60)
    quantity: int = Field(ge=1, le=10000)


class ResourceRead(BaseModel):
    id: int
    name: str
    type: str
    quantity: int

    class Config:
        from_attributes = True


class AllocationCreate(BaseModel):
    event_id: str = Field(min_length=2, max_length=120)
    resource_name: str = Field(min_length=2, max_length=120)
    quantity: int = Field(ge=1, le=10000)


class AllocationRead(BaseModel):
    id: int
    event_id: str
    resource_name: str
    quantity: int
    allocated_to: str
    allocated_at: datetime

    class Config:
        from_attributes = True
