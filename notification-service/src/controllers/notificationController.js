import { Notification } from "../models/Notification.js";
import { sendEmail } from "../services/emailService.js";
import { logger } from "../config/logger.js";

export const createNotification = async (req, res) => {
  const { recipient, subject, message } = req.body;

  const record = await Notification.create({
    recipient,
    subject,
    message,
    channel: "email",
    status: "queued",
    sourceService: "manual",
  });

  try {
    const delivery = await sendEmail({ to: recipient, subject, text: message });
    record.status = "sent";
    record.deliveryAttempts += 1;
    record.providerMessageId = delivery?.messageId || null;
    await record.save();
  } catch (error) {
    record.status = "failed";
    record.deliveryAttempts += 1;
    record.errorMessage = error.message;
    await record.save();
    logger.error("Manual notification send failed", { message: error.message, recipient });
    return res.status(502).json({ message: "Notification delivery failed", notification: record });
  }

  return res.status(201).json(record);
};

export const listNotifications = async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 50), 200);
  const filters = {};

  if (req.query.status) {
    filters.status = req.query.status;
  }

  if (req.query.topic) {
    filters.topic = req.query.topic;
  }

  if (req.query.recipient) {
    filters.recipient = req.query.recipient;
  }

  const rows = await Notification.find(filters).sort({ createdAt: -1 }).limit(limit);
  return res.json(rows);
};
