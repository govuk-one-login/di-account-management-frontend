import { createApp } from "./app";
import { logger } from "./utils/logger";
import blockedAt from "blocked-at";

const port: number | string = process.env.PORT || 6001;

(async () => {
  const app = await createApp();
  const server = app
    .listen(port, () => {
      logger.info(`Server listening on port ${port}`);
    })
    .on("error", (error: Error) => {
      logger.error(`Unable to start server because of ${error.message}`);
    });
  server.keepAliveTimeout = 61 * 1000;
  server.headersTimeout = 91 * 1000;

  blockedAt(
    (time, stack) => {
      const formattedStack = (stack || [])
        .map((frame: string) => frame.trim())
        .join("\n");

      // Log differently depending on how severe the block is
      if (time > 200) {
        logger.error(
          `Severe Event loop blockage detected! blocked for ${time}ms.\nStack trace:\n${formattedStack}`
        );
      } else {
        logger.warn(
          `Event loop blocked for ${time}ms. Stack trace:\n${formattedStack}`
        );
      }
    },
    {
      threshold: 50, // Set threshold to 50ms, feel free to adjust
      resourcesCap: 10, // Limit to 10 stack frames to avoid too much noise
    }
  );
})().catch((ex) => {
  logger.error(`Server failed to create app ${ex.message}`);
});
