from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, model_validator


class ResourceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    resource_type: str = Field(min_length=2, max_length=60)
    location: str = Field(min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    total_quantity: int = Field(ge=1, le=10000)


class ResourceUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    resource_type: str | None = Field(default=None, min_length=2, max_length=60)
    location: str | None = Field(default=None, min_length=2, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    total_quantity: int | None = Field(default=None, ge=1, le=10000)
    is_active: bool | None = None


class ResourceRead(BaseModel):
    id: str
    name: str
    resource_type: str
    location: str
    description: str | None
    total_quantity: int
    available_quantity: int
    is_active: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class AllocationCreate(BaseModel):
    event_id: str = Field(min_length=2, max_length=120)
    resource_id: str | None = Field(default=None, min_length=2)
    resource_name: str | None = Field(default=None, min_length=2, max_length=120)
    quantity: int = Field(ge=1, le=10000)
    starts_at: datetime
    ends_at: datetime
    notes: str | None = Field(default=None, max_length=1000)

    @model_validator(mode="after")
    def validate_request(self) -> "AllocationCreate":
        if self.resource_id is None and self.resource_name is None:
            raise ValueError("Either resource_id or resource_name is required")
        if self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be later than starts_at")
        return self


class AllocationRelease(BaseModel):
    reason: str | None = Field(default=None, max_length=400)


class AllocationRead(BaseModel):
    id: str
    event_id: str
    resource_id: str
    resource_name: str
    resource_type: str
    location: str
    quantity: int
    status: Literal["ALLOCATED", "RELEASED", "CANCELLED"]
    starts_at: datetime
    ends_at: datetime
    notes: str | None
    allocated_by: str
    created_at: datetime
    updated_at: datetime


class ResourceSummary(BaseModel):
    total_resources: int
    active_resources: int
    open_allocations: int
