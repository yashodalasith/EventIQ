import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import { createProxyMiddleware } from "http-proxy-middleware";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 4000);

const serviceUrls = {
  auth: process.env.AUTH_SERVICE_URL || "http://localhost:4001",
  event: process.env.EVENT_SERVICE_URL || "http://localhost:8081",
  resource: process.env.RESOURCE_SERVICE_URL || "http://localhost:8000",
  notification: process.env.NOTIFICATION_SERVICE_URL || "http://localhost:4004"
};

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true
  })
);
app.use(
  rateLimit({
    windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000),
    limit: Number(process.env.RATE_LIMIT_MAX || 300)
  })
);
app.use(morgan("combined"));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "gateway" }));

const optionalAuth = (req, _res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next();
  }
  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET || "change-me");
  } catch (_error) {
    req.user = undefined;
  }
  return next();
};

const requireAuth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, process.env.JWT_SECRET || "change-me");
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

app.use(
  "/auth",
  optionalAuth,
  createProxyMiddleware({
    target: serviceUrls.auth,
    changeOrigin: true
  })
);

app.use(
  "/events",
  optionalAuth,
  requireAuth,
  createProxyMiddleware({
    target: serviceUrls.event,
    changeOrigin: true
  })
);

app.use(
  "/resources",
  optionalAuth,
  requireAuth,
  createProxyMiddleware({
    target: serviceUrls.resource,
    changeOrigin: true
  })
);

app.use(
  "/allocate",
  optionalAuth,
  requireAuth,
  createProxyMiddleware({
    target: serviceUrls.resource,
    changeOrigin: true
  })
);

app.use(
  "/allocations",
  optionalAuth,
  requireAuth,
  createProxyMiddleware({
    target: serviceUrls.resource,
    changeOrigin: true
  })
);

app.use(
  "/notify",
  optionalAuth,
  requireAuth,
  createProxyMiddleware({
    target: serviceUrls.notification,
    changeOrigin: true
  })
);

app.use(
  "/notifications",
  optionalAuth,
  requireAuth,
  createProxyMiddleware({
    target: serviceUrls.notification,
    changeOrigin: true
  })
);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API Gateway listening on ${PORT}`);
});
