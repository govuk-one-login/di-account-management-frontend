import { zeroPad } from "./strings.js";

const REFERENCE_CODE_LENGTH = 6;

export function generateReferenceCode(): string {
  const random = Math.floor(Math.random() * 1000000 + 1);
  return zeroPad(random.toString(), REFERENCE_CODE_LENGTH);
}
