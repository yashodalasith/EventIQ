import { Router } from "express";
import { body } from "express-validator";
import {
  addAdminEmployeeId,
  deleteAccount,
  login,
  listAdminEmployeeIds,
  logout,
  logoutAll,
  profile,
  refreshAccessToken,
  register,
  revokeAdminEmployeeId,
  updateProfile,
} from "../controllers/authController.js";
import { requireAuth, requireRole } from "../middlewares/authMiddleware.js";
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

router.patch(
  "/profile",
  requireAuth,
  [
    body("name").optional().trim().isLength({ min: 2, max: 80 }),
    body("email").optional().isEmail().normalizeEmail(),
    body("password").optional().isLength({ min: 8, max: 72 }),
    body("role").optional().isIn(roleValues),
    body("profile").optional().isObject(),
  ],
  validateRequest,
  updateProfile,
);

router.delete(
  "/profile",
  requireAuth,
  [
    body("password")
      .exists({ checkFalsy: true })
      .withMessage("Password is required")
      .bail()
      .isLength({ min: 8, max: 72 })
      .withMessage("Password must be 8-72 characters"),
  ],
  validateRequest,
  deleteAccount,
);

router.post(
  "/admin/employee-ids",
  requireAuth,
  requireRole("admin"),
  [
    body("employeeId")
      .exists({ checkFalsy: true })
      .withMessage("employeeId is required")
      .bail()
      .isString()
      .withMessage("employeeId must be a string")
      .bail()
      .trim()
      .isLength({ min: 2, max: 60 })
      .withMessage("employeeId must be 2-60 characters"),
  ],
  validateRequest,
  addAdminEmployeeId,
);

router.get(
  "/admin/employee-ids",
  requireAuth,
  requireRole("admin"),
  listAdminEmployeeIds,
);

router.delete(
  "/admin/employee-ids/:employeeId",
  requireAuth,
  requireRole("admin"),
  revokeAdminEmployeeId,
);

router.post(
  "/profile/delete",
  requireAuth,
  [
    body("password")
      .exists({ checkFalsy: true })
      .withMessage("Password is required")
      .bail()
      .isLength({ min: 8, max: 72 })
      .withMessage("Password must be 8-72 characters"),
  ],
  validateRequest,
  deleteAccount,
);

export default router;
