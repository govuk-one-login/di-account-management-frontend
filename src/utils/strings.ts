import { randomBytes } from "crypto";

const urlRegex = new RegExp(
  "^(http(s)?://)?(www.)?[-a-zA-Z0-9@:%.+~#=]{2,256}\\.[a-z]{2,6}([-a-zA-Z0-9@:%_+.~#?&//=]*)$"
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

export function isValidUrl(url: string): boolean {
  return urlRegex.test(url);
}
