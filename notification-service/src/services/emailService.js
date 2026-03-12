import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const transport =
  env.emailTransportMode === "smtp"
    ? nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: false,
        auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined,
      })
    : nodemailer.createTransport({ jsonTransport: true });

export const sendEmail = async ({ to, subject, text }) => {
  const result = await transport.sendMail({
    from: env.emailFrom,
    to,
    subject,
    text,
  });

  logger.info("Email dispatch attempted", {
    to,
    subject,
    mode: env.emailTransportMode,
    messageId: result?.messageId,
  });

  return result;
};
