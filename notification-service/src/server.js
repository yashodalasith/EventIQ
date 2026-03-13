import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import {
  startKafkaConsumer,
  stopKafkaConsumer,
} from "./services/kafkaService.js";

let server;

const bootstrap = async () => {
  try {
    await connectDb();
    await startKafkaConsumer();

    server = app.listen(env.port, () => {
      logger.info(`Notification service listening on ${env.port}`);
    });
  } catch (error) {
    logger.error("Notification service failed to start", {
      message: error.message,
    });
    process.exit(1);
  }
};

const shutdown = async (signal) => {
  logger.info("Notification service shutting down", { signal });
  await stopKafkaConsumer();
  if (server) {
    server.close(() => process.exit(0));
    return;
  }
  process.exit(0);
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

bootstrap();
