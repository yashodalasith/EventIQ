import mongoose from "mongoose";
import { env } from "./env.js";
import { logger } from "./logger.js";

export const connectDb = async () => {
  await mongoose.connect(env.mongoUri);
  logger.info("Notification service connected to MongoDB");
};
