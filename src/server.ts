import { createApp, shutdownProcess, startServer } from "./app.js";
import { logger } from "./utils/logger.js";

(async () => {
  const app = await createApp();
  const { closeServer } = await startServer(app);
  const shutdown = shutdownProcess(closeServer);
  process.on("SIGTERM", () => void shutdown());
  process.on("SIGINT", () => void shutdown());
})().catch((ex) => {
  logger.error(`Server failed to create app ${ex.message}`);
});
