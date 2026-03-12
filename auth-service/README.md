# Auth Service

Node.js + Express authentication service.

## Features

- User registration and login
- JWT token issuing and verification
- Password hashing with bcrypt
- RBAC roles: admin, organizer, participant

## Prerequisites

- Node.js 20+
- MongoDB

## Setup

1. Copy `.env.sample` to `.env`
2. Install dependencies:
   - `npm install`
3. Run service:
   - `npm run dev`

## Endpoints

- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/profile`
