import logging

import httpx
from fastapi import HTTPException, status

from app.core.config import settings

logger = logging.getLogger(__name__)


def fetch_event(event_id: str, authorization: str | None) -> dict:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required to validate event ownership",
        )

    url = f"{settings.event_service_url}/events/{event_id}"
    try:
        response = httpx.get(
            url,
            headers={"Authorization": authorization},
            timeout=settings.http_timeout_seconds,
        )
    except httpx.HTTPError as exc:
        logger.exception("Failed to reach event service", extra={"event_id": event_id})
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Event service is unavailable",
        ) from exc

    if response.status_code == status.HTTP_404_NOT_FOUND:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Event not found",
        )

    if response.status_code in {status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN}:
        raise HTTPException(
            status_code=response.status_code,
            detail="Not authorized to validate this event",
        )

    if response.status_code >= 400:
        logger.warning(
            "Unexpected event service response",
            extra={"event_id": event_id, "status": response.status_code},
        )
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to validate event",
        )

    return response.json()
