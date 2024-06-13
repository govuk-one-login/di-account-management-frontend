import { zeroPad } from "./strings.js";

const REFERENCE_CODE_LENGTH = 6;

export type ReferenceCode = string;

export function generateReferenceCode(): ReferenceCode {
  const random = Math.floor(Math.random() * 1000000 + 1);
  return zeroPad(random.toString(), REFERENCE_CODE_LENGTH);
}
