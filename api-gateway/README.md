# API Gateway

Single entry point for all EventIQ services.

## Features

- JWT validation and auth forwarding
- Rate limiting
- CORS protection
- Reverse proxy routing to microservices

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

1. Copy `.env.sample` to `.env`
2. Install dependencies:
   - `npm install`
3. Start server:
   - `npm run dev`

## Routes

- `/auth/*` -> Auth Service
- `/events/*` -> Event Service
- `/resources|/allocate|/allocations` -> Resource Service
- `/notify|/notifications` -> Notification Service
