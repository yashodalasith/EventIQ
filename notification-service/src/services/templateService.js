import { env } from "../config/env.js";

function fallbackRecipient(payload) {
  return (
    payload?.recipientEmail ||
    payload?.organizerEmail ||
    payload?.participantEmail ||
    env.defaultRecipientEmail ||
    null
  );
}

export function buildTopicNotification(topic, payload) {
  switch (topic) {
    case env.eventCreatedTopic:
      return {
        recipient: fallbackRecipient(payload),
        subject: `Event created: ${payload.title || "Untitled Event"}`,
        message: `Your event ${payload.title || "Untitled Event"} was created successfully and is currently in draft state.${payload.eventDate ? ` Scheduled for ${payload.eventDate}.` : ""}`,
        eventId: payload.eventId,
        sourceService: "event-service",
      };
    case env.eventRegistrationTopic:
      return {
        recipient: fallbackRecipient(payload),
        subject: `Registration confirmed: ${payload.title || "Event"}`,
        message: `You have been registered for ${payload.title || "the event"}. Your registration ID is linked to event ${payload.eventId}.`,
        eventId: payload.eventId,
        sourceService: "event-service",
      };
    case env.resourceAllocationTopic: {
      const action = String(
        payload.action || payload.status || "ALLOCATED",
      ).toLowerCase();
      const verb =
        action === "released"
          ? "released"
          : action === "cancelled"
            ? "cancelled"
            : "allocated";
      const reason = payload.reason ? ` Reason: ${payload.reason}.` : "";

      return {
        recipient: fallbackRecipient(payload),
        subject:
          `Resource allocation ${verb} for event ${payload.eventId || ""}`.trim(),
        message: `Resource ${payload.resource || "resource"} has been ${verb} with quantity ${payload.quantity || 0}.${reason}`,
        eventId: payload.eventId,
        sourceService: "resource-service",
      };
    }
    default:
      return {
        recipient: fallbackRecipient(payload),
        subject: `Platform event received: ${topic}`,
        message: `A platform event was received on topic ${topic}.`,
        eventId: payload?.eventId,
        sourceService: "system",
      };
  }
}
