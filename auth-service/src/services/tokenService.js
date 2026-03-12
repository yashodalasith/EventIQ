import jwt from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env.js";

export const signAccessToken = (payload) =>
  jwt.sign({ ...payload, tokenType: "access" }, env.jwtSecret, {
    expiresIn: env.jwtAccessExpiresIn,
  });

export const signRefreshToken = (payload) =>
  jwt.sign({ ...payload, tokenType: "refresh" }, env.jwtRefreshSecret, {
    expiresIn: env.jwtRefreshExpiresIn,
  });

export const verifyAccessToken = (token) => {
  const decoded = jwt.verify(token, env.jwtSecret);
  if (decoded.tokenType && decoded.tokenType !== "access") {
    throw new Error("Invalid access token");
  }
  return decoded;
};

export const verifyRefreshToken = (token) => {
  const decoded = jwt.verify(token, env.jwtRefreshSecret);
  if (decoded.tokenType !== "refresh") {
    throw new Error("Invalid refresh token");
  }
  return decoded;
};

export const decodeToken = (token) => jwt.decode(token);

export const hashToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");
