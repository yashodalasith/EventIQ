import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/notificationRoutes.js";
import { env } from "./config/env.js";
import { errorHandler, notFoundHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true,
  }),
);
app.use(
  rateLimit({
    windowMs: env.rateLimitWindowMs,
    limit: env.rateLimitMax,
  }),
);
app.use(morgan("combined"));

app.get("/health", (_req, res) =>
  res.json({ status: "ok", service: "notification" }),
);
app.use("/", routes);
app.use(notFoundHandler);
app.use(errorHandler);
