from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.db import get_db
from app.core.messaging import publish
from app.core.security import decode_bearer_token
from app.models.resource import Allocation, Resource
from app.schemas.resource import AllocationCreate, AllocationRead, ResourceCreate, ResourceRead

router = APIRouter()


@router.post("/resources", response_model=ResourceRead)
def create_resource(
    request: ResourceCreate,
    payload=Depends(decode_bearer_token),
    db: Session = Depends(get_db),
):
    role = payload.get("role")
    if role not in ["admin", "organizer"]:
        raise HTTPException(status_code=403, detail="Only admin/organizer can create resources")

    resource = Resource(name=request.name, type=request.type, quantity=request.quantity)
    db.add(resource)
    db.commit()
    db.refresh(resource)
    return resource


@router.get("/resources", response_model=list[ResourceRead])
def get_resources(db: Session = Depends(get_db)):
    return db.query(Resource).all()


@router.post("/allocate", response_model=AllocationRead)
def allocate(
    request: AllocationCreate,
    payload=Depends(decode_bearer_token),
    db: Session = Depends(get_db),
):
    role = payload.get("role")
    if role not in ["admin", "organizer"]:
        raise HTTPException(status_code=403, detail="Only admin/organizer can allocate resources")

    resource = db.query(Resource).filter(Resource.name == request.resource_name).first()
    if not resource or resource.quantity < request.quantity:
        raise HTTPException(status_code=400, detail="Insufficient resource availability")

    resource.quantity -= request.quantity
    allocation = Allocation(
        event_id=request.event_id,
        resource_name=request.resource_name,
        quantity=request.quantity,
        allocated_to=payload.get("sub", "unknown"),
        allocated_at=datetime.now(timezone.utc),
    )

    db.add(allocation)
    db.commit()
    db.refresh(allocation)

    publish(
        "resource-allocation",
        {
            "eventId": allocation.event_id,
            "resource": allocation.resource_name,
            "quantity": allocation.quantity,
            "allocatedTo": allocation.allocated_to,
        },
    )
    return allocation


@router.get("/allocations", response_model=list[AllocationRead])
def get_allocations(db: Session = Depends(get_db)):
    return db.query(Allocation).all()
