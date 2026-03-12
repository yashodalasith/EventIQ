import bcrypt from "bcryptjs";
import { User } from "../models/User.js";
import { signToken } from "../services/tokenService.js";
import { logger } from "../config/logger.js";

export const register = async (req, res) => {
  const { name, email, password, role } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, passwordHash, role });

  logger.info("User registered", { email: user.email, role: user.role });
  return res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
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

  const token = signToken({
    sub: user._id.toString(),
    email: user.email,
    role: user.role
  });

  logger.info("User logged in", { email: user.email });
  return res.json({ token });
};

export const profile = async (req, res) => {
  const user = await User.findById(req.user.sub).select("name email role createdAt");
  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }
  return res.json({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
  });
};
