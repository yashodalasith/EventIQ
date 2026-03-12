import { Kafka } from "kafkajs";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { Notification } from "../models/Notification.js";
import { sendEmail } from "./emailService.js";
import { buildTopicNotification } from "./templateService.js";

const kafka = new Kafka({ brokers: env.kafkaBrokers });
const consumer = kafka.consumer({ groupId: env.kafkaGroupId });
let kafkaConnected = false;
let isStarting = false;
let startupRequested = true;

const topics = [
  env.eventCreatedTopic,
  env.eventRegistrationTopic,
  env.resourceAllocationTopic,
];

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const isRetryableKafkaError = (error) => {
  const message = (error?.message || "").toLowerCase();
  return (
    message.includes("econnrefused") ||
    message.includes("there is no leader") ||
    message.includes("group coordinator is not available") ||
    message.includes("connection error")
  );
};

export const startKafkaConsumer = async () => {
  if (isStarting || kafkaConnected) {
    return;
  }

  isStarting = true;
  startupRequested = true;
  let attempts = 0;

  while (startupRequested) {
    try {
      attempts += 1;

      await consumer.connect();
      for (const topic of topics) {
        await consumer.subscribe({ topic, fromBeginning: true });
      }

      await consumer.run({
        eachMessage: async ({ topic, message }) => {
          try {
            const payload = JSON.parse(message.value.toString());
            const built = buildTopicNotification(topic, payload);

            const record = await Notification.create({
              recipient: built.recipient || "system",
              subject: built.subject,
              message: built.message,
              channel: "kafka",
              topic,
              payload,
              sourceService: built.sourceService,
              eventId: built.eventId,
              status: built.recipient ? "queued" : "skipped",
            });

            if (built.recipient) {
              try {
                const delivery = await sendEmail({
                  to: built.recipient,
                  subject: built.subject,
                  text: built.message,
                });
                record.status = "sent";
                record.deliveryAttempts += 1;
                record.providerMessageId = delivery?.messageId || null;
                await record.save();
              } catch (error) {
                record.status = "failed";
                record.deliveryAttempts += 1;
                record.errorMessage = error.message;
                await record.save();
                logger.error("Kafka notification email delivery failed", {
                  topic,
                  message: error.message,
                  payload,
                });
              }
            } else {
              record.errorMessage = "No recipient available for topic payload";
              await record.save();
            }

            logger.info("Kafka event processed", { topic, payload });
          } catch (error) {
            logger.error("Kafka processing failed", { message: error.message });
          }
        },
      });

      kafkaConnected = true;
      logger.info("Kafka consumer connected", {
        brokers: env.kafkaBrokers,
        topics,
      });
      break;
    } catch (error) {
      kafkaConnected = false;
      const retryable = isRetryableKafkaError(error);
      const maxRetries = env.kafkaStartupMaxRetries;
      const shouldStop = maxRetries > 0 && attempts >= maxRetries;

      logger.warn("Kafka consumer startup failed, will retry", {
        attempt: attempts,
        retryable,
        message: error.message,
      });

      if (!startupRequested || shouldStop || !retryable) {
        isStarting = false;
        throw error;
      }

      await wait(env.kafkaStartupRetryMs);
    }
  }

  isStarting = false;
};

export const getKafkaStatus = () => ({ connected: kafkaConnected, topics });

export const stopKafkaConsumer = async () => {
  startupRequested = false;

  if (!kafkaConnected) {
    return;
  }

  try {
    await consumer.disconnect();
  } finally {
    kafkaConnected = false;
  }
};
