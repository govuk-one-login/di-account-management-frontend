import fs from "fs";
import path from "path";

export const readEnvVar = (filename: string): string => {
  try {
    const keysDir = "./tmp/keys";
    const keyValue = fs
      .readFileSync(path.join(keysDir, filename), "utf8")
      .trim();
    // eslint-disable-next-line no-console
    console.log(filename, keyValue);
    return keyValue;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`Error reading ${filename}:`, error);
    return "";
  }
};

// Assuming the keys are stored in 'GENERATOR_KEY_ARN' and 'WRAPPING_KEY_ARN' files
// process.env.GENERATOR_KEY_ARN = readEnvVar("GENERATOR_KEY_ARN");
// process.env.WRAPPING_KEY_ARN = readEnvVar("WRAPPING_KEY_ARN");
