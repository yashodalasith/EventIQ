# Auth Service

Node.js + Express authentication service.

## Features

- User registration and login with role-specific profile details
- Access and refresh token issuing with secure refresh token rotation
- Refresh token persistence in MongoDB for session tracking and revocation
- Single-session logout and global logout-all support
- Password hashing with bcrypt
- RBAC roles: admin, organizer, participant
- Input validation with express-validator
- CORS, Helmet, and rate limiting controls from environment variables

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
- `POST /auth/refresh`
- `POST /auth/logout`
- `POST /auth/logout-all`
- `GET /auth/profile`

## Registration Profile Requirements

- `admin`: `profile.department`, `profile.employeeId`
- `organizer`: `profile.organization`, `profile.phone`, `profile.title`
- `participant`: `profile.institution`, `profile.program`, `profile.graduationYear`

## Token Response Shape

- `accessToken`
- `refreshToken`
- `user` object containing `id`, `name`, `email`, `role`, role-specific `profile`, `createdAt`, and `lastLoginAt`
