# Event Service

Spring Boot microservice for event management.

## Features

- Event CRUD and listing
- Registration to events
- Request validation (`@Valid`)
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

- `POST /events`
- `GET /events`
- `GET /events/{id}`
- `PUT /events/{id}`
- `POST /events/{id}/register`
