import { randomBytes } from "crypto";

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
