import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4004),
  mongoUri:
    process.env.MONGO_URI || "mongodb://localhost:27017/notification_db",
  kafkaBrokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
  kafkaGroupId: process.env.KAFKA_GROUP_ID || "notification-group",
  emailFrom: process.env.EMAIL_FROM || "no-reply@eventiq.local",
  smtpHost: process.env.SMTP_HOST || "localhost",
  smtpPort: Number(process.env.SMTP_PORT || 1025),
  smtpUser: process.env.SMTP_USER || "",
  smtpPass: process.env.SMTP_PASS || "",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
};
