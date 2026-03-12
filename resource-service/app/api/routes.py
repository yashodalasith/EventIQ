from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload

from app.core.db import get_db
from app.core.event_client import fetch_event
from app.core.messaging import publish_resource_allocation
from app.core.security import decode_bearer_token, require_roles
from app.models.resource import Allocation, Resource
from app.schemas.resource import (
    AllocationCreate,
    AllocationRead,
    AllocationRelease,
    ResourceCreate,
    ResourceRead,
    ResourceSummary,
    ResourceUpdate,
)

router = APIRouter()


def _map_allocation(allocation: Allocation) -> AllocationRead:
    resource = allocation.resource
    return AllocationRead(
        id=allocation.id,
        event_id=allocation.event_id,
        resource_id=allocation.resource_id,
        resource_name=resource.name,
        resource_type=resource.resource_type,
        location=resource.location,
        quantity=allocation.quantity,
        status=allocation.status,
        starts_at=allocation.starts_at,
        ends_at=allocation.ends_at,
        notes=allocation.notes,
        allocated_by=allocation.allocated_by,
        created_at=allocation.created_at,
        updated_at=allocation.updated_at,
    )


@router.post("/resources", response_model=ResourceRead, status_code=status.HTTP_201_CREATED)
def create_resource(
    request: ResourceCreate,
    payload: dict = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    duplicate = db.execute(
        select(Resource).where(
            func.lower(Resource.name) == request.name.lower(),
            func.lower(Resource.location) == request.location.lower(),
        )
    ).scalar_one_or_none()
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Resource with this name already exists at the selected location",
        )

    resource = Resource(
        name=request.name,
        resource_type=request.resource_type,
        location=request.location,
        description=request.description,
        total_quantity=request.total_quantity,
        available_quantity=request.total_quantity,
        is_active=True,
    )
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.get("/resources", response_model=list[ResourceRead])
def get_resources(
    resource_type: str | None = Query(default=None),
    location: str | None = Query(default=None),
    available_only: bool = Query(default=False),
    active_only: bool = Query(default=True),
    db: Session = Depends(get_db),
):
    query = select(Resource)
    if resource_type:
        query = query.where(func.lower(Resource.resource_type) == resource_type.lower())
    if location:
        query = query.where(func.lower(Resource.location) == location.lower())
    if available_only:
        query = query.where(Resource.available_quantity > 0)
    if active_only:
        query = query.where(Resource.is_active.is_(True))

    resources = db.execute(query.order_by(Resource.location, Resource.name)).scalars().all()
    return resources


@router.get("/resources/summary", response_model=ResourceSummary)
def get_resource_summary(
    payload: dict = Depends(require_roles("admin", "organizer")),
    db: Session = Depends(get_db),
):
    total_resources = db.scalar(select(func.count(Resource.id))) or 0
    active_resources = db.scalar(
        select(func.count(Resource.id)).where(Resource.is_active.is_(True))
    ) or 0
    open_allocations = db.scalar(
        select(func.count(Allocation.id)).where(Allocation.status == "ALLOCATED")
    ) or 0

    return ResourceSummary(
        total_resources=total_resources,
        active_resources=active_resources,
        open_allocations=open_allocations,
    )


@router.get("/resources/{resource_id}", response_model=ResourceRead)
def get_resource(resource_id: int, db: Session = Depends(get_db)):
    resource = db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    return resource


@router.put("/resources/{resource_id}", response_model=ResourceRead)
def update_resource(
    resource_id: int,
    request: ResourceUpdate,
    payload: dict = Depends(require_roles("admin")),
    db: Session = Depends(get_db),
):
    resource = db.get(Resource, resource_id)
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    allocated_quantity = resource.total_quantity - resource.available_quantity

    for field, value in request.model_dump(exclude_unset=True).items():
        setattr(resource, field, value)

    if request.total_quantity is not None:
        if request.total_quantity < allocated_quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Total quantity cannot be lower than currently allocated quantity",
            )
        resource.available_quantity = request.total_quantity - allocated_quantity

    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.post("/allocate", response_model=AllocationRead, status_code=status.HTTP_201_CREATED)
def allocate(
    request: AllocationCreate,
    authorization: Annotated[str | None, Header()] = None,
    payload: dict = Depends(require_roles("admin", "organizer")),
    db: Session = Depends(get_db),
):
    event = fetch_event(request.event_id, authorization)
    actor_role = payload.get("role")
    actor_id = payload.get("sub")

    if actor_role == "organizer" and event.get("organizerId") != actor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organizers can only allocate resources for their own events",
        )

    if request.resource_id is not None:
        resource = db.get(Resource, request.resource_id)
    else:
        resource = db.execute(
            select(Resource).where(func.lower(Resource.name) == request.resource_name.lower())
        ).scalar_one_or_none()

    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    if not resource.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive resources cannot be allocated",
        )

    overlapping_quantity = db.scalar(
        select(func.coalesce(func.sum(Allocation.quantity), 0)).where(
            Allocation.resource_id == resource.id,
            Allocation.status == "ALLOCATED",
            Allocation.starts_at < request.ends_at,
            Allocation.ends_at > request.starts_at,
        )
    ) or 0

    remaining_quantity = resource.total_quantity - overlapping_quantity
    if remaining_quantity < request.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient resource availability for the selected schedule",
        )

    allocation = Allocation(
        event_id=request.event_id,
        resource_id=resource.id,
        quantity=request.quantity,
        status="ALLOCATED",
        starts_at=request.starts_at,
        ends_at=request.ends_at,
        notes=request.notes,
        allocated_by=actor_id,
    )

    resource.available_quantity = max(resource.available_quantity - request.quantity, 0)
    db.add(allocation)
    db.add(resource)
    db.commit()
    db.refresh(allocation)
    db.refresh(resource)

    publish_resource_allocation(
        {
            "eventId": allocation.event_id,
            "resource": resource.name,
            "resourceId": resource.id,
            "resourceType": resource.resource_type,
            "location": resource.location,
            "quantity": allocation.quantity,
            "allocatedTo": actor_id,
            "startsAt": allocation.starts_at.isoformat(),
            "endsAt": allocation.ends_at.isoformat(),
        }
    )

    allocation = db.execute(
        select(Allocation)
        .options(joinedload(Allocation.resource))
        .where(Allocation.id == allocation.id)
    ).scalar_one()
    return _map_allocation(allocation)


@router.get("/allocations", response_model=list[AllocationRead])
def get_allocations(
    event_id: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    resource_id: int | None = Query(default=None),
    payload: dict = Depends(require_roles("admin", "organizer")),
    authorization: Annotated[str | None, Header()] = None,
    db: Session = Depends(get_db),
):
    if payload.get("role") == "organizer":
        if not event_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Organizers must provide event_id when viewing allocations",
            )
        event = fetch_event(event_id, authorization)
        if event.get("organizerId") != payload.get("sub"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Organizers can only view allocations for their own events",
            )

    query = select(Allocation).options(joinedload(Allocation.resource))

    if event_id:
        query = query.where(Allocation.event_id == event_id)
    if status_filter:
        query = query.where(Allocation.status == status_filter.upper())
    if resource_id:
        query = query.where(Allocation.resource_id == resource_id)

    allocations = db.execute(query.order_by(Allocation.starts_at.desc())).scalars().all()
    return [_map_allocation(item) for item in allocations]


@router.post("/allocations/{allocation_id}/release", response_model=AllocationRead)
def release_allocation(
    allocation_id: int,
    request: AllocationRelease,
    authorization: Annotated[str | None, Header()] = None,
    payload: dict = Depends(require_roles("admin", "organizer")),
    db: Session = Depends(get_db),
):
    allocation = db.execute(
        select(Allocation)
        .options(joinedload(Allocation.resource))
        .where(Allocation.id == allocation_id)
    ).scalar_one_or_none()
    if not allocation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found")

    if allocation.status != "ALLOCATED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active allocations can be released",
        )

    event = fetch_event(allocation.event_id, authorization)
    actor_role = payload.get("role")
    actor_id = payload.get("sub")
    if actor_role == "organizer" and event.get("organizerId") != actor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organizers can only release allocations for their own events",
        )

    allocation.status = "RELEASED"
    allocation.notes = request.reason or allocation.notes
    allocation.updated_at = datetime.now(timezone.utc)
    allocation.resource.available_quantity = min(
        allocation.resource.total_quantity,
        allocation.resource.available_quantity + allocation.quantity,
    )

    db.add(allocation)
    db.add(allocation.resource)
    db.commit()
    db.refresh(allocation)
    db.refresh(allocation.resource)
    return _map_allocation(allocation)
