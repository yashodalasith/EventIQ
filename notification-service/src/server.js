import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { startKafkaConsumer } from "./services/kafkaService.js";

const bootstrap = async () => {
  try {
    await connectDb();
    await startKafkaConsumer();

    app.listen(env.port, () => {
      logger.info(`Notification service listening on ${env.port}`);
    });
  } catch (error) {
    logger.error("Notification service failed to start", {
      message: error.message,
    });
    process.exit(1);
  }
};

bootstrap();
