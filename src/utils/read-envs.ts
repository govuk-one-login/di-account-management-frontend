import fs from "fs";
import path from "path";
import { logError, logger } from "./logger";

export const readEnvVar = (filename: string): string => {
  try {
    const keysDir = "./tmp/keys";
    const keyValue = fs
      .readFileSync(path.join(keysDir, filename), "utf8")
      .trim();
    return keyValue;
  } catch (error) {
    logError(logger, `Error reading ${filename}:`, error);
    return "";
  }
};

// Assuming the keys are stored in 'GENERATOR_KEY_ARN' and 'WRAPPING_KEY_ARN' files
// process.env.GENERATOR_KEY_ARN = readEnvVar("GENERATOR_KEY_ARN");
// process.env.WRAPPING_KEY_ARN = readEnvVar("WRAPPING_KEY_ARN");
