import { Router } from "express";
import { body } from "express-validator";
import { login, profile, register } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";

const router = Router();

router.post(
  "/register",
  [
    body("name").trim().notEmpty(),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
    body("role").optional().isIn(["admin", "organizer", "participant"]),
  ],
  validateRequest,
  register,
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8 }),
  ],
  validateRequest,
  login,
);

router.get("/profile", requireAuth, profile);

export default router;
