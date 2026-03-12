import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import { AdminEmployeeId } from "../models/AdminEmployeeId.js";
import { env } from "../config/env.js";
import {
  decodeToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/tokenService.js";
import { logger } from "../config/logger.js";

let adminEmployeeIdsSeeded = false;

const normalizeEmployeeId = (value) =>
  String(value || "")
    .trim()
    .toUpperCase();

const ensureAdminEmployeeIdsSeeded = async () => {
  if (adminEmployeeIdsSeeded) {
    return;
  }

  const employeeIds = Array.from(
    new Set(env.adminEmployeeIds.map(normalizeEmployeeId).filter(Boolean)),
  );
  if (!employeeIds.length) {
    adminEmployeeIdsSeeded = true;
    return;
  }

  await AdminEmployeeId.bulkWrite(
    employeeIds.map((employeeId) => ({
      updateOne: {
        filter: { employeeId },
        update: {
          $setOnInsert: {
            employeeId,
            source: "predefined",
            addedBy: null,
          },
        },
        upsert: true,
      },
    })),
  );

  adminEmployeeIdsSeeded = true;
};

const listAdminEmployeeIdRows = async () => {
  await ensureAdminEmployeeIdsSeeded();

  const [employeeIds, assignedAdmins] = await Promise.all([
    AdminEmployeeId.find({}).sort({ employeeId: 1 }).lean(),
    User.find(
      {
        role: "admin",
        "profile.admin.employeeId": { $exists: true, $ne: null },
      },
      "name email profile.admin.employeeId",
    ).lean(),
  ]);

  const assignedByEmployeeId = new Map(
    assignedAdmins.map((admin) => [
      normalizeEmployeeId(admin.profile?.admin?.employeeId),
      {
        id: admin._id.toString(),
        name: admin.name,
        email: admin.email,
      },
    ]),
  );

  return employeeIds.map((entry) => {
    const assignedAdmin = assignedByEmployeeId.get(entry.employeeId) || null;
    return {
      id: entry._id.toString(),
      employeeId: entry.employeeId,
      source: entry.source,
      createdAt: entry.createdAt,
      assignedAdmin,
    };
  });
};

const validateAdminEmployeeIdForRole = async ({
  employeeId,
  userId = null,
}) => {
  const normalizedEmployeeId = normalizeEmployeeId(employeeId);

  if (!normalizedEmployeeId) {
    return {
      ok: false,
      status: 400,
      message: "Employee ID is required for admin role",
    };
  }

  await ensureAdminEmployeeIdsSeeded();

  const allowedEmployeeId = await AdminEmployeeId.findOne({
    employeeId: normalizedEmployeeId,
  });
  if (!allowedEmployeeId) {
    return {
      ok: false,
      status: 403,
      message: "Employee number does not exist in our records",
    };
  }

  const existingUser = await User.findOne({
    "profile.admin.employeeId": normalizedEmployeeId,
  });
  if (existingUser && existingUser._id.toString() !== String(userId || "")) {
    return {
      ok: false,
      status: 409,
      message: "Employee number is already linked to another account",
    };
  }

  return { ok: true, employeeId: normalizedEmployeeId };
};

const normalizeProfileByRole = (role, profile = {}) => {
  if (role === "admin") {
    return {
      admin: {
        department: profile.department,
        employeeId: profile.employeeId,
      },
    };
  }

  if (role === "organizer") {
    return {
      organizer: {
        organization: profile.organization,
        phone: profile.phone,
        title: profile.title,
      },
    };
  }

  return {
    participant: {
      institution: profile.institution,
      program: profile.program,
      graduationYear: profile.graduationYear,
    },
  };
};

const validateRoleProfileData = (role, profile = {}) => {
  if (role === "admin") {
    return Boolean(profile.department && profile.employeeId);
  }

  if (role === "organizer") {
    return Boolean(profile.organization && profile.phone && profile.title);
  }

  return Boolean(
    profile.institution && profile.program && profile.graduationYear,
  );
};

const getIpAddress = (req) => {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return req.ip;
};

const buildPublicUser = (user) => {
  const roleProfile = user.profile?.[user.role] || {};

  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    profile: roleProfile,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
  };
};

const issueTokenPair = (user, sessionId) => {
  const payload = {
    sub: user._id.toString(),
    email: user.email,
    role: user.role,
    sid: sessionId,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  return { accessToken, refreshToken };
};

const persistRefreshToken = async ({
  user,
  refreshToken,
  sessionId,
  req,
  replacedByTokenHash,
}) => {
  const refreshDecoded = decodeToken(refreshToken);
  const expiresAt = refreshDecoded?.exp
    ? new Date(refreshDecoded.exp * 1000)
    : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return RefreshToken.create({
    userId: user._id,
    sessionId,
    tokenHash: hashToken(refreshToken),
    expiresAt,
    createdByIp: getIpAddress(req),
    userAgent: req.headers["user-agent"],
    replacedByTokenHash,
  });
};

export const register = async (req, res) => {
  const { name, email, password } = req.body;
  const role = req.body.role || "participant";
  const profile = { ...(req.body.profile || {}) };

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: "Email already exists" });
  }

  if (role === "admin") {
    const adminEmployeeValidation = await validateAdminEmployeeIdForRole({
      employeeId: profile.employeeId,
    });
    if (!adminEmployeeValidation.ok) {
      return res.status(adminEmployeeValidation.status).json({
        message: adminEmployeeValidation.message,
      });
    }
    profile.employeeId = adminEmployeeValidation.employeeId;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role,
    profile: normalizeProfileByRole(role, profile),
  });

  const sessionId = crypto.randomUUID();
  const tokens = issueTokenPair(user, sessionId);
  await persistRefreshToken({
    user,
    refreshToken: tokens.refreshToken,
    sessionId,
    req,
  });

  logger.info("User registered", { email: user.email, role: user.role });

  return res.status(201).json({
    user: buildPublicUser(user),
    token: tokens.accessToken,
    ...tokens,
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    logger.warn("Login failed: user not found", { email });
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    logger.warn("Login failed: wrong password", { email });
    return res.status(401).json({ message: "Invalid credentials" });
  }

  user.lastLoginAt = new Date();
  await user.save();

  const sessionId = crypto.randomUUID();
  const tokens = issueTokenPair(user, sessionId);
  await persistRefreshToken({
    user,
    refreshToken: tokens.refreshToken,
    sessionId,
    req,
  });

  logger.info("User logged in", { email: user.email, role: user.role });

  return res.json({
    user: buildPublicUser(user),
    token: tokens.accessToken,
    ...tokens,
  });
};

export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  let decoded;
  try {
    decoded = verifyRefreshToken(refreshToken);
  } catch (_error) {
    return res
      .status(401)
      .json({ message: "Invalid or expired refresh token" });
  }

  const tokenHash = hashToken(refreshToken);
  const existing = await RefreshToken.findOne({
    tokenHash,
    userId: decoded.sub,
    revokedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });

  if (!existing) {
    return res.status(401).json({ message: "Refresh token is not active" });
  }

  const user = await User.findById(decoded.sub);
  if (!user) {
    existing.revokedAt = new Date();
    existing.revokedReason = "user_deleted";
    await existing.save();
    return res.status(401).json({ message: "User no longer exists" });
  }

  const nextSessionId = decoded.sid || crypto.randomUUID();
  const nextTokens = issueTokenPair(user, nextSessionId);
  const nextRefreshHash = hashToken(nextTokens.refreshToken);

  existing.revokedAt = new Date();
  existing.revokedReason = "rotated";
  existing.replacedByTokenHash = nextRefreshHash;
  await existing.save();

  await persistRefreshToken({
    user,
    refreshToken: nextTokens.refreshToken,
    sessionId: nextSessionId,
    req,
    replacedByTokenHash: null,
  });

  return res.json({
    user: buildPublicUser(user),
    token: nextTokens.accessToken,
    ...nextTokens,
  });
};

export const logout = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    verifyRefreshToken(refreshToken);
  } catch (_error) {
    return res.status(204).send();
  }

  const tokenHash = hashToken(refreshToken);
  await RefreshToken.updateOne(
    {
      tokenHash,
      revokedAt: { $exists: false },
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: "logout",
      },
    },
  );

  return res.status(204).send();
};

export const logoutAll = async (req, res) => {
  await RefreshToken.updateMany(
    {
      userId: req.user.sub,
      revokedAt: { $exists: false },
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: "logout_all",
      },
    },
  );

  return res.status(204).send();
};

export const profile = async (req, res) => {
  const user = await User.findById(req.user.sub).select(
    "name email role profile createdAt lastLoginAt",
  );

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  return res.json(buildPublicUser(user));
};

export const updateProfile = async (req, res) => {
  const { name, email, password, role, profile } = req.body;

  const user = await User.findById(req.user.sub);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  let roleChanged = false;
  const nextRole = role || user.role;

  if (name !== undefined) {
    user.name = name;
  }

  if (email !== undefined) {
    const normalizedEmail = String(email).trim().toLowerCase();
    if (normalizedEmail !== user.email) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(409).json({ message: "Email already exists" });
      }
      user.email = normalizedEmail;
    }
  }

  if (password) {
    user.passwordHash = await bcrypt.hash(password, 12);
  }

  if (role && role !== user.role) {
    roleChanged = true;
    user.role = role;
  }

  if (profile) {
    const mergedProfile = {
      ...(user.profile?.[nextRole] || {}),
      ...profile,
    };

    if (nextRole === "admin") {
      const adminEmployeeValidation = await validateAdminEmployeeIdForRole({
        employeeId: mergedProfile.employeeId,
        userId: user._id,
      });
      if (!adminEmployeeValidation.ok) {
        return res.status(adminEmployeeValidation.status).json({
          message: adminEmployeeValidation.message,
        });
      }
      mergedProfile.employeeId = adminEmployeeValidation.employeeId;
    }

    if (!validateRoleProfileData(nextRole, mergedProfile)) {
      return res.status(400).json({
        message: `Profile fields are incomplete for role ${nextRole}`,
      });
    }

    const normalized = normalizeProfileByRole(nextRole, mergedProfile);
    user.set(`profile.${nextRole}`, normalized[nextRole]);
  }

  if (
    roleChanged &&
    !validateRoleProfileData(nextRole, user.profile?.[nextRole])
  ) {
    return res.status(400).json({
      message: `Role change to ${nextRole} requires complete role profile data`,
    });
  }

  if (roleChanged && nextRole === "admin") {
    const adminEmployeeValidation = await validateAdminEmployeeIdForRole({
      employeeId: user.profile?.admin?.employeeId,
      userId: user._id,
    });
    if (!adminEmployeeValidation.ok) {
      return res.status(adminEmployeeValidation.status).json({
        message: adminEmployeeValidation.message,
      });
    }
    user.set("profile.admin.employeeId", adminEmployeeValidation.employeeId);
  }

  await user.save();

  // Role claims live in JWT, so rotate sessions whenever role changes.
  if (roleChanged) {
    await RefreshToken.updateMany(
      {
        userId: user._id,
        revokedAt: { $exists: false },
      },
      {
        $set: {
          revokedAt: new Date(),
          revokedReason: "role_changed",
        },
      },
    );

    const sessionId = crypto.randomUUID();
    const tokens = issueTokenPair(user, sessionId);
    await persistRefreshToken({
      user,
      refreshToken: tokens.refreshToken,
      sessionId,
      req,
    });

    return res.json({
      user: buildPublicUser(user),
      token: tokens.accessToken,
      ...tokens,
    });
  }

  return res.json({ user: buildPublicUser(user) });
};

export const deleteAccount = async (req, res) => {
  const { password } = req.body;

  const user = await User.findById(req.user.sub);
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  const matches = await bcrypt.compare(password, user.passwordHash);
  if (!matches) {
    return res.status(401).json({ message: "Invalid password" });
  }

  await RefreshToken.updateMany(
    {
      userId: user._id,
      revokedAt: { $exists: false },
    },
    {
      $set: {
        revokedAt: new Date(),
        revokedReason: "account_deleted",
      },
    },
  );

  await User.deleteOne({ _id: user._id });
  return res.status(204).send();
};

export const addAdminEmployeeId = async (req, res) => {
  const employeeId = normalizeEmployeeId(req.body.employeeId);
  if (!employeeId) {
    return res.status(400).json({ message: "employeeId is required" });
  }

  await ensureAdminEmployeeIdsSeeded();

  const existing = await AdminEmployeeId.findOne({ employeeId });
  if (existing) {
    return res
      .status(409)
      .json({ message: "Employee number already exists in allowlist" });
  }

  const alreadyAssigned = await User.findOne({
    "profile.admin.employeeId": employeeId,
  });
  if (alreadyAssigned) {
    return res.status(409).json({
      message: "Employee number is already linked to an admin account",
    });
  }

  const created = await AdminEmployeeId.create({
    employeeId,
    source: "manual",
    addedBy: req.user.sub,
  });

  return res.status(201).json({
    employeeId: created.employeeId,
    source: created.source,
    createdAt: created.createdAt,
  });
};

export const listAdminEmployeeIds = async (_req, res) => {
  const rows = await listAdminEmployeeIdRows();
  return res.json(rows);
};

export const revokeAdminEmployeeId = async (req, res) => {
  const employeeId = normalizeEmployeeId(req.params.employeeId);
  if (!employeeId) {
    return res.status(400).json({ message: "employeeId is required" });
  }

  await ensureAdminEmployeeIdsSeeded();

  const existing = await AdminEmployeeId.findOne({ employeeId });
  if (!existing) {
    return res
      .status(404)
      .json({ message: "Employee number was not found in allowlist" });
  }

  if (existing.source === "predefined") {
    return res.status(400).json({
      message:
        "Predefined employee numbers must be removed from ADMIN_EMPLOYEE_IDS in env",
    });
  }

  const assignedAdmin = await User.findOne({
    role: "admin",
    "profile.admin.employeeId": employeeId,
  });
  if (assignedAdmin) {
    return res.status(409).json({
      message: "Employee number is already linked to an admin account",
    });
  }

  await AdminEmployeeId.deleteOne({ _id: existing._id });
  return res.status(204).send();
};
