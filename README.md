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


## Azure Event Hubs Kafka Option

Azure Event Hubs is a practical low-cost deployment choice for this project and works with the existing Kafka client code.

Required setup:

1. Create an Event Hubs namespace in Azure.
2. Enable the Kafka endpoint and use port `9093`.
3. Create Event Hubs named `event-created`, `event-registration`, and `resource-allocation`.
4. Use a Shared Access Policy connection string for Kafka SASL authentication.
5. For the notification consumer group, use an existing Event Hubs consumer group such as `$Default`, or create your own in Azure first.

Service env mapping:

- `event-service`: use `KAFKA_BOOTSTRAP_SERVERS=<namespace>.servicebus.windows.net:9093`, `KAFKA_SECURITY_PROTOCOL=SASL_SSL`, `KAFKA_SASL_MECHANISM=PLAIN`, and set `KAFKA_SASL_JAAS_CONFIG` with username `$ConnectionString` and password equal to the Event Hubs connection string.
- `notification-service`: use `KAFKA_BROKERS=<namespace>.servicebus.windows.net:9093`, `KAFKA_SECURITY_PROTOCOL=SASL_SSL`, `KAFKA_SASL_MECHANISM=plain`, `KAFKA_SASL_USERNAME=$ConnectionString`, `KAFKA_SASL_PASSWORD=<Event Hubs connection string>`.
- `resource-service`: use `KAFKA_BOOTSTRAP_SERVERS=<namespace>.servicebus.windows.net:9093`, `KAFKA_SECURITY_PROTOCOL=SASL_SSL`, `KAFKA_SASL_MECHANISM=PLAIN`, `KAFKA_SASL_USERNAME=$ConnectionString`, `KAFKA_SASL_PASSWORD=<Event Hubs connection string>`.

Notes:

- `KAFKA_SSL_CAFILE` should usually stay empty unless your runtime requires a custom CA bundle.
- Keep hostname verification enabled: `KAFKA_SSL_CHECK_HOSTNAME=true` and `KAFKA_SSL_ENDPOINT_IDENTIFICATION_ALGORITHM=https`.
- Local Docker Kafka is still supported by switching the env values back to the commented `PLAINTEXT` examples in each `.env.sample`.
