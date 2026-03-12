import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const transport = nodemailer.createTransport({
  host: env.smtpHost,
  port: env.smtpPort,
  secure: false,
  auth: env.smtpUser ? { user: env.smtpUser, pass: env.smtpPass } : undefined
});

export const sendEmail = async ({ to, subject, text }) => {
  return transport.sendMail({
    from: env.emailFrom,
    to,
    subject,
    text
  });
};
