import { CODE_CHALLENGE_VALUES } from "../../app.constants.js";
import { getRandomValues } from "crypto";

export default function generateCodeVerifier(): string {
  const cryptoArray = new Uint8Array(
    CODE_CHALLENGE_VALUES.CODE_VERIFIER_LENGTH
  );
  getRandomValues(cryptoArray);

  let codeVerifier = "";
  for (let x = 0; x < CODE_CHALLENGE_VALUES.CODE_VERIFIER_LENGTH; x++) {
    codeVerifier += CODE_CHALLENGE_VALUES.CODE_VERIFIER_CHAR_SET.charAt(
      cryptoArray[x] % CODE_CHALLENGE_VALUES.CODE_VERIFIER_CHAR_SET.length
    );
  }

  return codeVerifier;
}
