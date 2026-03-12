import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/notificationRoutes.js";
import { env } from "./config/env.js";

export const app = express();

app.use(helmet());
app.use(express.json());
app.use(
  cors({
    origin: env.corsOrigin,
    credentials: true
  })
);
app.use(morgan("combined"));

app.get("/health", (_req, res) => res.json({ status: "ok", service: "notification" }));
app.use("/", routes);
