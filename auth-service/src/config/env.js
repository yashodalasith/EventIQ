import dotenv from "dotenv";

dotenv.config();

const parseNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const env = {
  port: parseNumber(process.env.PORT, 4001),
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI || "mongodb://localhost:27017/auth_db",
  jwtSecret: process.env.JWT_SECRET || "change-me",
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || "15m",
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || "change-me-refresh",
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  rateLimitWindowMs: parseNumber(
    process.env.RATE_LIMIT_WINDOW_MS,
    15 * 60 * 1000,
  ),
  rateLimitMax: parseNumber(process.env.RATE_LIMIT_MAX, 200),
};
