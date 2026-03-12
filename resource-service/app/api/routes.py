from datetime import datetime, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException, Query, status

from app.core.db import get_database, to_object_id
from app.core.event_client import fetch_event
from app.core.messaging import publish_resource_allocation
from app.core.security import require_roles
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


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _parse_iso(value: str | datetime) -> datetime:
    if isinstance(value, datetime):
        return value
    try:
        normalized = value.replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid datetime format",
        ) from exc


def _resource_read(document: dict) -> ResourceRead:
    return ResourceRead(
        id=str(document["_id"]),
        name=document["name"],
        resource_type=document["resource_type"],
        location=document["location"],
        description=document.get("description"),
        total_quantity=document["total_quantity"],
        available_quantity=document["available_quantity"],
        is_active=document["is_active"],
        created_at=_parse_iso(document["created_at"]),
        updated_at=_parse_iso(document["updated_at"]),
    )


def _allocation_read(allocation_doc: dict, resource_doc: dict) -> AllocationRead:
    return AllocationRead(
        id=str(allocation_doc["_id"]),
        event_id=allocation_doc["event_id"],
        resource_id=str(allocation_doc["resource_id"]),
        resource_name=resource_doc["name"],
        resource_type=resource_doc["resource_type"],
        location=resource_doc["location"],
        quantity=allocation_doc["quantity"],
        status=allocation_doc["status"],
        starts_at=_parse_iso(allocation_doc["starts_at"]),
        ends_at=_parse_iso(allocation_doc["ends_at"]),
        notes=allocation_doc.get("notes"),
        allocated_by=allocation_doc["allocated_by"],
        created_at=_parse_iso(allocation_doc["created_at"]),
        updated_at=_parse_iso(allocation_doc["updated_at"]),
    )


@router.post("/resources", response_model=ResourceRead, status_code=status.HTTP_201_CREATED)
def create_resource(
    request: ResourceCreate,
    payload: dict = Depends(require_roles("admin")),
):
    db = get_database()
    resources = db["resources"]

    duplicate = resources.find_one(
        {
            "name": {"$regex": f"^{request.name}$", "$options": "i"},
            "location": {"$regex": f"^{request.location}$", "$options": "i"},
        }
    )
    if duplicate:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Resource with this name already exists at the selected location",
        )

    now = _now_iso()
    document = {
        "name": request.name,
        "resource_type": request.resource_type,
        "location": request.location,
        "description": request.description,
        "total_quantity": request.total_quantity,
        "available_quantity": request.total_quantity,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
        "created_by": payload.get("sub"),
    }

    inserted = resources.insert_one(document)
    created = resources.find_one({"_id": inserted.inserted_id})
    return _resource_read(created)


@router.get("/resources", response_model=list[ResourceRead])
def get_resources(
    resource_type: str | None = Query(default=None),
    location: str | None = Query(default=None),
    available_only: bool = Query(default=False),
    active_only: bool = Query(default=True),
):
    db = get_database()
    resources = db["resources"]

    filters: dict = {}
    if resource_type:
        filters["resource_type"] = {"$regex": f"^{resource_type}$", "$options": "i"}
    if location:
        filters["location"] = {"$regex": f"^{location}$", "$options": "i"}
    if available_only:
        filters["available_quantity"] = {"$gt": 0}
    if active_only:
        filters["is_active"] = True

    rows = list(resources.find(filters).sort([("location", 1), ("name", 1)]))
    return [_resource_read(item) for item in rows]


@router.get("/resources/summary", response_model=ResourceSummary)
def get_resource_summary(payload: dict = Depends(require_roles("admin", "organizer"))):
    db = get_database()
    resources = db["resources"]
    allocations = db["allocations"]

    return ResourceSummary(
        total_resources=resources.count_documents({}),
        active_resources=resources.count_documents({"is_active": True}),
        open_allocations=allocations.count_documents({"status": "ALLOCATED"}),
    )


@router.get("/resources/{resource_id}", response_model=ResourceRead)
def get_resource(resource_id: str):
    db = get_database()
    resources = db["resources"]

    try:
        resource = resources.find_one({"_id": to_object_id(resource_id)})
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")
    return _resource_read(resource)


@router.put("/resources/{resource_id}", response_model=ResourceRead)
def update_resource(
    resource_id: str,
    request: ResourceUpdate,
    payload: dict = Depends(require_roles("admin")),
):
    db = get_database()
    resources = db["resources"]

    try:
        object_id = to_object_id(resource_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    resource = resources.find_one({"_id": object_id})
    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    updates = request.model_dump(exclude_unset=True)

    allocated_quantity = resource["total_quantity"] - resource["available_quantity"]
    if "total_quantity" in updates and updates["total_quantity"] < allocated_quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Total quantity cannot be lower than currently allocated quantity",
        )

    if "total_quantity" in updates:
        updates["available_quantity"] = updates["total_quantity"] - allocated_quantity

    updates["updated_at"] = _now_iso()
    resources.update_one({"_id": object_id}, {"$set": updates})

    updated = resources.find_one({"_id": object_id})
    return _resource_read(updated)


@router.post("/allocate", response_model=AllocationRead, status_code=status.HTTP_201_CREATED)
def allocate(
    request: AllocationCreate,
    authorization: Annotated[str | None, Header()] = None,
    payload: dict = Depends(require_roles("admin", "organizer")),
):
    db = get_database()
    resources = db["resources"]
    allocations = db["allocations"]

    event = fetch_event(request.event_id, authorization)
    actor_role = payload.get("role")
    actor_id = payload.get("sub")

    if actor_role == "organizer" and event.get("organizerId") != actor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organizers can only allocate resources for their own events",
        )

    resource = None
    if request.resource_id is not None:
        try:
            resource = resources.find_one({"_id": to_object_id(request.resource_id)})
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
    else:
        resource = resources.find_one(
            {"name": {"$regex": f"^{request.resource_name}$", "$options": "i"}}
        )

    if not resource:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Resource not found")

    if not resource.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive resources cannot be allocated",
        )

    starts_at_iso = request.starts_at.astimezone(timezone.utc).isoformat()
    ends_at_iso = request.ends_at.astimezone(timezone.utc).isoformat()

    overlapping_quantity = 0
    overlap_cursor = allocations.find(
        {
            "resource_id": resource["_id"],
            "status": "ALLOCATED",
            "starts_at": {"$lt": ends_at_iso},
            "ends_at": {"$gt": starts_at_iso},
        }
    )
    for row in overlap_cursor:
        overlapping_quantity += int(row["quantity"])

    remaining_quantity = int(resource["total_quantity"]) - overlapping_quantity
    if remaining_quantity < request.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient resource availability for the selected schedule",
        )

    now = _now_iso()
    allocation_doc = {
        "event_id": request.event_id,
        "resource_id": resource["_id"],
        "quantity": request.quantity,
        "status": "ALLOCATED",
        "starts_at": starts_at_iso,
        "ends_at": ends_at_iso,
        "notes": request.notes,
        "allocated_by": actor_id,
        "created_at": now,
        "updated_at": now,
    }
    inserted = allocations.insert_one(allocation_doc)

    next_available = max(int(resource["available_quantity"]) - request.quantity, 0)
    resources.update_one(
        {"_id": resource["_id"]},
        {"$set": {"available_quantity": next_available, "updated_at": now}},
    )

    publish_resource_allocation(
        {
            "eventId": request.event_id,
            "resource": resource["name"],
            "resourceId": str(resource["_id"]),
            "resourceType": resource["resource_type"],
            "location": resource["location"],
            "quantity": request.quantity,
            "allocatedTo": actor_id,
            "startsAt": starts_at_iso,
            "endsAt": ends_at_iso,
        }
    )

    allocation = allocations.find_one({"_id": inserted.inserted_id})
    resource_latest = resources.find_one({"_id": resource["_id"]})
    return _allocation_read(allocation, resource_latest)


@router.get("/allocations", response_model=list[AllocationRead])
def get_allocations(
    event_id: str | None = Query(default=None),
    status_filter: str | None = Query(default=None, alias="status"),
    resource_id: str | None = Query(default=None),
    payload: dict = Depends(require_roles("admin", "organizer")),
    authorization: Annotated[str | None, Header()] = None,
):
    db = get_database()
    resources = db["resources"]
    allocations = db["allocations"]

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

    filters: dict = {}
    if event_id:
        filters["event_id"] = event_id
    if status_filter:
        filters["status"] = status_filter.upper()
    if resource_id:
        try:
            filters["resource_id"] = to_object_id(resource_id)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

    rows = list(allocations.find(filters).sort("starts_at", -1))
    response: list[AllocationRead] = []
    for row in rows:
        resource = resources.find_one({"_id": row["resource_id"]})
        if not resource:
            continue
        response.append(_allocation_read(row, resource))

    return response


@router.post("/allocations/{allocation_id}/release", response_model=AllocationRead)
def release_allocation(
    allocation_id: str,
    request: AllocationRelease,
    authorization: Annotated[str | None, Header()] = None,
    payload: dict = Depends(require_roles("admin", "organizer")),
):
    db = get_database()
    resources = db["resources"]
    allocations = db["allocations"]

    try:
        allocation_object_id = to_object_id(allocation_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    allocation = allocations.find_one({"_id": allocation_object_id})
    if not allocation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Allocation not found")

    if allocation.get("status") != "ALLOCATED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only active allocations can be released",
        )

    event = fetch_event(allocation["event_id"], authorization)
    actor_role = payload.get("role")
    actor_id = payload.get("sub")
    if actor_role == "organizer" and event.get("organizerId") != actor_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Organizers can only release allocations for their own events",
        )

    resource = resources.find_one({"_id": allocation["resource_id"]})
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Linked resource not found",
        )

    now = _now_iso()
    notes = request.reason or allocation.get("notes")
    allocations.update_one(
        {"_id": allocation_object_id},
        {"$set": {"status": "RELEASED", "notes": notes, "updated_at": now}},
    )

    next_available = min(
        int(resource["total_quantity"]),
        int(resource["available_quantity"]) + int(allocation["quantity"]),
    )
    resources.update_one(
        {"_id": resource["_id"]},
        {"$set": {"available_quantity": next_available, "updated_at": now}},
    )

    allocation_latest = allocations.find_one({"_id": allocation_object_id})
    resource_latest = resources.find_one({"_id": resource["_id"]})
    return _allocation_read(allocation_latest, resource_latest)
