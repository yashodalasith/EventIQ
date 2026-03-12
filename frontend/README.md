# Frontend (EventIQ)

React + Vite + Tailwind frontend for EventIQ with implemented Auth and Event Service workflows.

## Prerequisites

- Node.js 20+
- npm 10+

## Setup

1. Copy `.env.sample` to `.env`
2. Install dependencies:
   - `npm install`
3. Run dev server:
   - `npm run dev`

## Environment Variables

- `VITE_API_BASE_URL`: API Gateway base URL (default local: `http://localhost:4000`)

## Implemented Screens

- Login and registration connected to Auth Service
- Protected routes with session persistence
- Dashboard with live event metrics from Event Service
- Events listing with search, status filter, register action, publish action
- Create Event form connected to Event Service create endpoint
- My Registrations based on participant registration data

## Notes

- Events endpoints are called through API Gateway and require a valid JWT.
- Create and publish actions require organizer/admin roles.

## Build

- `npm run build`
- `npm run preview`
