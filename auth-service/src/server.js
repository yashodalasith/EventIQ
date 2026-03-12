import { app } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";
import { logger } from "./config/logger.js";

const bootstrap = async () => {
  try {
    await connectDb();
    app.listen(env.port, () => {
      logger.info(`Auth service listening on ${env.port}`);
    });
  } catch (error) {
    logger.error("Auth service failed to start", { message: error.message });
    process.exit(1);
  }
};

bootstrap();
