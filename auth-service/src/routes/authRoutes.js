import { Router } from "express";
import { body } from "express-validator";
import {
  login,
  logout,
  logoutAll,
  profile,
  refreshAccessToken,
  register,
} from "../controllers/authController.js";
import { requireAuth } from "../middlewares/authMiddleware.js";
import { validateRequest } from "../middlewares/validateRequest.js";

const router = Router();

const roleValues = ["admin", "organizer", "participant"];

const validateRoleProfile = body().custom((value) => {
  const role = value.role || "participant";
  const profile = value.profile || {};

  if (role === "admin") {
    if (!profile.department || !profile.employeeId) {
      throw new Error("Admin profile requires department and employeeId");
    }
  }

  if (role === "organizer") {
    if (!profile.organization || !profile.phone || !profile.title) {
      throw new Error(
        "Organizer profile requires organization, phone, and title",
      );
    }
  }

  if (role === "participant") {
    if (!profile.institution || !profile.program || !profile.graduationYear) {
      throw new Error(
        "Participant profile requires institution, program, and graduationYear",
      );
    }
  }

  return true;
});

router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2, max: 80 }),
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 8, max: 72 }),
    body("role").optional().isIn(roleValues),
    body("profile").isObject(),
    validateRoleProfile,
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

router.post(
  "/refresh",
  [body("refreshToken").isString().isLength({ min: 20 })],
  validateRequest,
  refreshAccessToken,
);

router.post(
  "/logout",
  [body("refreshToken").isString().isLength({ min: 20 })],
  validateRequest,
  logout,
);

router.post("/logout-all", requireAuth, logoutAll);

router.get("/profile", requireAuth, profile);

export default router;
