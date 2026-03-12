import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";

const escapeHtml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildEventIqEmailHtml = ({ subject, text, to }) => {
  const safeSubject = escapeHtml(subject || "EventIQ Notification");
  const bodyLines = String(text || "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => `<p style=\"margin:0 0 10px;color:#334155;font-size:15px;line-height:1.6;\">${escapeHtml(line)}</p>`)
    .join("");

  const preview = escapeHtml(String(text || "").slice(0, 160));
  const sentTo = escapeHtml(to || "");

  return `<!doctype html>
<html lang=\"en\">
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>${safeSubject}</title>
  </head>
  <body style=\"margin:0;padding:24px;background:#f3f6fb;font-family:Manrope,Segoe UI,Arial,sans-serif;\">
    <div style=\"max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #dbe3ef;border-radius:16px;overflow:hidden;\">
      <div style=\"padding:22px 24px;background:linear-gradient(135deg,#0f62fe,#0b4ad1);color:#ffffff;\">
        <div style=\"font-size:11px;letter-spacing:.16em;text-transform:uppercase;opacity:.88;\">EventIQ Notification</div>
        <h1 style=\"margin:10px 0 0;font-size:24px;line-height:1.25;\">${safeSubject}</h1>
      </div>
      <div style=\"padding:24px;\">
        ${bodyLines || '<p style=\"margin:0;color:#334155;font-size:15px;line-height:1.6;\">You have a new update from EventIQ.</p>'}
        <div style=\"margin-top:18px;padding:12px 14px;background:#f8fbff;border:1px solid #e2e8f0;border-radius:10px;color:#64748b;font-size:12px;\">
          Recipient: ${sentTo}
        </div>
      </div>
      <div style=\"padding:14px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;color:#64748b;font-size:12px;line-height:1.5;\">
        ${preview}<br/>Sent via EventIQ Communication Service.
      </div>
    </div>
  </body>
</html>`;
};

const transport =
  env.emailTransportMode === "smtp"
    ? nodemailer.createTransport({
        host: env.smtpHost,
        port: env.smtpPort,
        secure: false,
        auth: env.smtpUser
          ? { user: env.smtpUser, pass: env.smtpPass }
          : undefined,
      })
    : nodemailer.createTransport({ jsonTransport: true });

export const sendEmail = async ({ to, subject, text, html }) => {
  const resolvedText = text || "";
  const resolvedHtml = html || buildEventIqEmailHtml({
    subject,
    text: resolvedText,
    to,
  });

  const result = await transport.sendMail({
    from: env.emailFrom,
    to,
    subject,
    text: resolvedText,
    html: resolvedHtml,
  });

  logger.info("Email dispatch attempted", {
    to,
    subject,
    mode: env.emailTransportMode,
    messageId: result?.messageId,
  });

  return result;
};
