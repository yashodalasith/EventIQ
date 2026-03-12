# Resource Service

FastAPI microservice for resource inventory and allocation.

## Features

- Manage resources inventory
- Allocate resources to events
- Pydantic input validation
- JWT-based role checks
- Kafka publishing for `resource-allocation`

## Prerequisites

- Python 3.11+
- PostgreSQL
- Kafka

## Setup

1. Copy `.env.sample` to `.env`
2. Create virtual environment and install dependencies:
   - `python -m venv .venv`
   - `.venv\\Scripts\\activate`
   - `pip install -r requirements.txt`
3. Run service:
   - `uvicorn app.main:app --reload --port 8000`

## Endpoints

- `POST /resources`
- `GET /resources`
- `POST /allocate`
- `GET /allocations`
