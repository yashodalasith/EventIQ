import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: String, default: "system" },
    channel: { type: String, enum: ["email", "kafka"], required: true },
    topic: { type: String },
    subject: { type: String },
    message: { type: String },
    payload: { type: Object },
    status: {
      type: String,
      enum: ["pending", "queued", "sent", "failed", "received", "skipped"],
      default: "pending",
    },
    sourceService: { type: String, default: "system" },
    eventId: { type: String },
    providerMessageId: { type: String },
    errorMessage: { type: String },
    deliveryAttempts: { type: Number, default: 0 },
  },
  { timestamps: true },
);

export const Notification = mongoose.model("Notification", notificationSchema);
