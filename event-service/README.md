# Event Service

Spring Boot microservice for event management.

## Features

- Event creation, listing, detail, update, publish, and registrations
- Role-based authorization via Auth Service profile validation
- Ownership checks (only owner/admin can update/publish)
- Request validation (`@Valid`, field constraints)
- Rate limiting with configurable limits
- Structured error responses and request logging
- REST integration with Auth Service profile endpoint
- Kafka publishing for `event-created` and `event-registration`

## Prerequisites

- Java 17+
- Maven 3.9+
- MongoDB
- Kafka

## Setup

1. Copy `.env.sample` to `.env`
2. Run service:
   - `mvn spring-boot:run`

## Endpoints

- `GET /health`
- `POST /events` (admin, organizer)
- `GET /events` (public list)
- `GET /events/{id}`
- `PUT /events/{id}` (owner or admin)
- `GET /events/mine` (admin, organizer)
- `POST /events/{id}/publish` (owner or admin)
- `POST /events/{id}/register` (authenticated user)

## Security Practices

- CORS restricted by `CORS_ORIGIN`
- Rate limiting (`RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS`)
- Auth forwarding and validation via Authorization header
- RBAC enforcement (`admin`, `organizer`, `participant`)
- Input validation for all write operations
- Structured logs for requests and Kafka publish status

## Integration

- REST: calls Auth Service `GET /auth/profile` to validate token and fetch role/id
- Kafka topic emits:
  - `event-created`
  - `event-registration`

## Azure Event Hubs Notes

- This service already works with Azure Event Hubs Kafka endpoint through environment variables only.
- Set `KAFKA_BOOTSTRAP_SERVERS` to `<namespace>.servicebus.windows.net:9093`.
- Set `KAFKA_SECURITY_PROTOCOL=SASL_SSL` and `KAFKA_SASL_MECHANISM=PLAIN`.
- Set `KAFKA_SASL_JAAS_CONFIG` using username `$ConnectionString` and the Event Hubs connection string as the password value.
- Create Event Hubs named `event-created` and `event-registration` before publishing.
