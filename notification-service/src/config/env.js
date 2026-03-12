import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4004),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri:
    process.env.MONGO_URI || "mongodb://localhost:27017/notification_db",
  kafkaBrokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  kafkaGroupId: process.env.KAFKA_GROUP_ID || "notification-group",
  eventCreatedTopic: process.env.EVENT_CREATED_TOPIC || "event-created",
  eventRegistrationTopic:
    process.env.EVENT_REGISTRATION_TOPIC || "event-registration",
  resourceAllocationTopic:
    process.env.RESOURCE_ALLOCATION_TOPIC || "resource-allocation",
  emailFrom: process.env.EMAIL_FROM || "no-reply@eventiq.local",
  emailTransportMode: process.env.EMAIL_TRANSPORT_MODE || "stub",
  smtpHost: process.env.SMTP_HOST || "localhost",
  smtpPort: Number(process.env.SMTP_PORT || 1025),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  directAuthEnabled: (process.env.DIRECT_AUTH_ENABLED || "true") === "true",
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
  rateLimitMax: Number(process.env.RATE_LIMIT_MAX || 200),
  defaultRecipientEmail: process.env.DEFAULT_RECIPIENT_EMAIL || "",
};
