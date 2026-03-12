# Resource Service

FastAPI microservice for resource inventory, scheduling, and event-linked allocation.

## Features

- Manage resource inventory with location, quantity, and active status
- Allocate resources to specific events across a scheduled time window
- Release allocations and restore inventory capacity
- Validate event existence and organizer ownership through Event Service REST calls
- Pydantic input validation and JWT-based RBAC checks
- Kafka publishing for `resource-allocation`
- MongoDB-based persistence (local Docker Mongo or MongoDB Atlas free tier)
- Request logging and in-memory rate limiting

## Prerequisites

- Python 3.11+
- MongoDB
- Kafka

## Setup

1. Copy `.env.sample` to `.env`
2. Create virtual environment and install dependencies:
   - `python -m venv .venv`
   - `.venv\\Scripts\\activate`
   - `pip install -r requirements.txt`
3. Run service:
   - `uvicorn app.main:app --reload --port 8001`

## Endpoints

- `POST /resources`
- `GET /resources`
- `GET /resources/summary`
- `GET /resources/{id}`
- `PUT /resources/{id}`
- `POST /allocate`
- `GET /allocations`
- `POST /allocations/{id}/release`

## Role Access

- `admin`: create resources, update resources, allocate resources, release allocations, view summaries
- `organizer`: allocate resources for events they own, release those allocations, view summary and allocations
- `participant`: view resource inventory only

## MongoDB Hosting Notes

- Recommended free cloud option: MongoDB Atlas
- Set `MONGO_URI` with your Atlas connection string
- Use `MONGO_DB_NAME=resource_db` (or another db name)
- For local Docker, use `MONGO_URI=mongodb://mongodb:27017`

## Integration

- Resource allocation calls Event Service over REST to verify the target event exists
- Kafka publishes `resource-allocation` messages for Notification Service and downstream consumers
