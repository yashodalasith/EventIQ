import { logger } from "../config/logger.js";

export const notFoundHandler = (_req, res) => {
  return res.status(404).json({ message: "Route not found" });
};

export const errorHandler = (error, _req, res, _next) => {
  logger.error("Notification service request failed", {
    message: error.message,
    stack: error.stack,
  });

  return res.status(500).json({ message: "Internal server error" });
};
