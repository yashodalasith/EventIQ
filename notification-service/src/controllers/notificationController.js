import { Notification } from "../models/Notification.js";
import { sendEmail } from "../services/emailService.js";

export const createNotification = async (req, res) => {
  const { recipient, subject, message } = req.body;

  const record = await Notification.create({
    recipient,
    subject,
    message,
    channel: "email",
    status: "queued"
  });

  await sendEmail({ to: recipient, subject, text: message });
  record.status = "sent";
  await record.save();

  return res.status(201).json(record);
};

export const listNotifications = async (_req, res) => {
  const rows = await Notification.find().sort({ createdAt: -1 }).limit(200);
  return res.json(rows);
};
