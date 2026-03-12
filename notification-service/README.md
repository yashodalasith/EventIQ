# Notification Service

Node.js microservice for email notifications and Kafka consumption.

## Features

- Consume Kafka topics:
  - `event-created`
  - `event-registration`
  - `resource-allocation`
- Send email notifications from Kafka events
- Store notification records and delivery results in MongoDB
- Manual notification endpoint for testing
- Direct JWT auth protection for service endpoints
- Configurable rate limiting, CORS, and email transport mode

## Prerequisites

- Node.js 20+
- MongoDB
- Kafka

## Setup

1. Copy `.env.sample` to `.env`
2. Install dependencies:
   - `npm install`
3. Run service:
   - `npm run dev`

## Environment Notes

- `EMAIL_TRANSPORT_MODE=stub` is safe for local development and CI.
- Set `EMAIL_TRANSPORT_MODE=smtp` with SMTP credentials for real delivery.
- `DIRECT_AUTH_ENABLED=true` protects `/notify` and `/notifications` when calling the service directly.

## Endpoints

- `GET /health`
- `POST /notify` (admin, organizer)
- `GET /notifications` (admin, organizer)

## Kafka Integration

- `event-registration`: sends registration confirmation email to `participantEmail`
- `event-created`: sends organizer notification if recipient email is present or fallback email configured
- `resource-allocation`: stores event and sends fallback email if configured
