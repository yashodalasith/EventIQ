import bcrypt from "bcryptjs";
import crypto from "crypto";
import { User } from "../models/User.js";
import { RefreshToken } from "../models/RefreshToken.js";
import {
  decodeToken,
  hashToken,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../services/tokenService.js";
import { logger } from "../config/logger.js";

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
  const profile = req.body.profile || {};

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: "Email already exists" });
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
