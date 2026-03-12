# Notification Service

Node.js microservice for email notifications and Kafka consumption.

## Features

- Consume Kafka topics:
  - `event-created`
  - `event-registration`
  - `resource-allocation`
- Store notification records in MongoDB
- Manual notification endpoint for testing

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

## Endpoints

- `POST /notify`
- `GET /notifications`
