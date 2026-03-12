import { Router } from "express";
import { body } from "express-validator";
import {
  createNotification,
  listNotifications,
} from "../controllers/notificationController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";

const router = Router();

router.post(
  "/notify",
  requireAuth,
  requireRole("admin", "organizer"),
  [
    body("recipient").isEmail(),
    body("subject").isString().isLength({ min: 3, max: 120 }),
    body("message").isString().isLength({ min: 3, max: 2000 }),
  ],
  validateRequest,
  createNotification,
);

router.get(
  "/notifications",
  requireAuth,
  requireRole("admin", "organizer"),
  listNotifications,
);

export default router;
