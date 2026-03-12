import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: String, default: "system" },
    channel: { type: String, enum: ["email", "kafka"], required: true },
    topic: { type: String },
    subject: { type: String },
    message: { type: String },
    payload: { type: Object },
    status: { type: String, default: "pending" },
  },
  { timestamps: true },
);

export const Notification = mongoose.model("Notification", notificationSchema);
