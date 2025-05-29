import { promisify } from "util";
import { randomBytes } from "crypto";

import { logger } from "./logger";

const lowerAndUpperCaseLettersAndNumbersMax50 = /^[a-zA-Z0-9_-]{1,50}$/;

export function containsNumber(value: string): boolean {
  return value ? /\d/.test(value) : false;
}

export function containsNumbersOnly(value: string): boolean {
  return value ? /^\d+$/.test(value) : false;
}

const asyncRandomBytes = promisify(randomBytes);

export async function generateNonce(): Promise<string> {
  return (await asyncRandomBytes(16)).toString("hex");
}

export function isValidUrl(urlString: string | undefined): boolean {
  if (!urlString) {
    return false;
  }

  try {
    const url = new URL(urlString);
    return !(
      url.hostname === "" ||
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1"
    );
  } catch (error) {
    logger.warn({ url: urlString }, error.toString());
    return false;
  }
}

export function isSafeString(url: string): boolean {
  return lowerAndUpperCaseLettersAndNumbersMax50.test(url);
}
export function zeroPad(input: string, length: number): string {
  const pad = "0".repeat(length);
  return (pad + input).slice(-length);
}

export function splitSecretKeyIntoFragments(secretKey: string): string[] {
  if (secretKey.length > 0) {
    return secretKey.match(/\w{1,4}/g);
  }
  return [];
}
