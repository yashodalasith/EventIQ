import { Kafka } from "kafkajs";
import { env } from "../config/env.js";
import { logger } from "../config/logger.js";
import { Notification } from "../models/Notification.js";

const kafka = new Kafka({ brokers: env.kafkaBrokers });
const consumer = kafka.consumer({ groupId: env.kafkaGroupId });

const topics = ["event-created", "event-registration", "resource-allocation"];

export const startKafkaConsumer = async () => {
  await consumer.connect();

  for (const topic of topics) {
    await consumer.subscribe({ topic, fromBeginning: true });
  }

  await consumer.run({
    eachMessage: async ({ topic, message }) => {
      try {
        const payload = JSON.parse(message.value.toString());
        await Notification.create({
          channel: "kafka",
          topic,
          payload,
          status: "received",
        });
        logger.info("Kafka event processed", { topic, payload });
      } catch (error) {
        logger.error("Kafka processing failed", { message: error.message });
      }
    },
  });
};
