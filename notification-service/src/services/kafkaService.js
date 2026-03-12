import { Kafka } from "kafkajs";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { Notification } from "../models/Notification.js";
import { sendEmail } from "./emailService.js";
import { buildTopicNotification } from "./templateService.js";

const kafka = new Kafka({ brokers: env.kafkaBrokers });
const consumer = kafka.consumer({ groupId: env.kafkaGroupId });
let kafkaConnected = false;

const topics = [
  env.eventCreatedTopic,
  env.eventRegistrationTopic,
  env.resourceAllocationTopic,
];

export const startKafkaConsumer = async () => {
  await consumer.connect();
  kafkaConnected = true;

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
};

export const getKafkaStatus = () => ({ connected: kafkaConnected, topics });

export const stopKafkaConsumer = async () => {
  if (!kafkaConnected) {
    return;
  }
  await consumer.disconnect();
  kafkaConnected = false;
};
