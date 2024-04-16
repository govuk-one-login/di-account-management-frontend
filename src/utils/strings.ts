import { randomBytes } from "crypto";
import { logger } from "./logger";

const lowerAndUpperCaseLettersAndNumbersMax50 = new RegExp(
  "^[a-zA-Z0-9_-]{1,50}$"
);

export function containsNumber(value: string): boolean {
  return value ? /\d/.test(value) : false;
}

export function containsNumbersOnly(value: string): boolean {
  return value ? /^\d+$/.test(value) : false;
}

export function redactPhoneNumber(value: string): string | undefined {
  return value
    ? "*".repeat(value.length - 4) + value.trim().slice(value.length - 4)
    : undefined;
}

export function generateNonce(): string {
  return randomBytes(16).toString("hex");
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
  } catch (e) {
    logger.warn({ url: urlString }, e.toString());
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
