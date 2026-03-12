# Smart Event & Resource Management Platform

Initial monorepo scaffold for a 4-microservice architecture with a React frontend, API gateway, Docker-based local integration, and CI pipeline.

## Services

- `frontend`: React + Vite + Tailwind responsive UI shell
- `api-gateway`: Node.js API gateway with auth forwarding + rate limiting
- `auth-service`: Node.js + Express + MongoDB Atlas (JWT + bcrypt + RBAC)
- `event-service`: Spring Boot + MongoDB event management
- `resource-service`: FastAPI + PostgreSQL resource scheduling
- `notification-service`: Node.js + Kafka consumer/producer + email notifications

## Local Run (Docker Compose)

```bash
docker compose up --build
```

## Branching Model

- `main`: stable baseline and releases
- `develop`: integration branch
- `feature-auth`, `feature-events`, `feature-resources`, `feature-notifications`
- `deployment`: cloud deployment hardening

## Security Baseline Included

- JWT authentication + role checks
- Password hashing with bcrypt
- Input validation in all services
- CORS controls
- Helmet and rate limiting
- Env-based secret management (`.env.sample`)
- Non-root Docker users

## Integration Patterns Included

- REST: Event Service -> Auth Service (profile validation)
- Kafka: Event/Resource domain events -> Notification Service
