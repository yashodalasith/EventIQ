import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const requireAuth = (req, res, next) => {
  if (!env.directAuthEnabled) {
    return next();
  }

  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = header.split(" ")[1];
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch (_error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!env.directAuthEnabled) {
      return next();
    }

    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  };
