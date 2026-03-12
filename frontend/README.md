# Frontend (EventIQ)

React + Vite + Tailwind frontend for EventIQ with implemented Auth, Event Service, and Notification Service workflows.

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

- Login and registration connected to Auth Service with role-specific profile forms
- Protected routes with session persistence, refresh-token restore, and logout/logout-all controls
- Dashboard with live event metrics from Event Service
- Events listing with search, status filter, register action, publish action
- Create Event form connected to Event Service create endpoint
- My Registrations based on participant registration data
- Notifications center with live delivery history, topic filters, operational metrics, and manual send form for organizer/admin roles

## Notes

- Events and notifications endpoints are called through API Gateway and require a valid JWT.
- Notification management and manual sends require organizer/admin roles.
- `VITE_BYPASS_AUTH=true` keeps the notifications page in preview mode with sample data when no authenticated session is present.

## Build

- `npm run build`
- `npm run preview`
