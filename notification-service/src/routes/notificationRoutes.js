import { Router } from "express";
import { body } from "express-validator";
import { createNotification, listNotifications } from "../controllers/notificationController.js";
import { validateRequest } from "../middlewares/validateRequest.js";

const router = Router();

router.post(
  "/notify",
  [
    body("recipient").isEmail(),
    body("subject").isString().isLength({ min: 3, max: 120 }),
    body("message").isString().isLength({ min: 3, max: 2000 })
  ],
  validateRequest,
  createNotification
);

router.get("/notifications", listNotifications);

export default router;
