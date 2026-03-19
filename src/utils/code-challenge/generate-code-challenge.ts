import { subtle } from "crypto";
import base64url from "base64url";

export default async function generateCodeChallenge(
  verifier: string
): Promise<string> {
  const verifierBuffer = new TextEncoder().encode(verifier);

  const hashBuffer = await subtle.digest("SHA-256", verifierBuffer);

  const codeChallengeString = base64url.default.encode(Buffer.from(hashBuffer));

  return codeChallengeString
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}
