import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";

app.listen(env.PORT, () => {
  logger.info(`GrowEasy CSV Importer API started`, {
    port: env.PORT,
    environment: env.NODE_ENV,
    batchSize: env.BATCH_SIZE,
    concurrency: env.BATCH_CONCURRENCY,
    maxUploadMb: env.MAX_UPLOAD_MB,
  });
});
