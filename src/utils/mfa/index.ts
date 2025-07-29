import { getAppEnv, isProd } from "../../config";
import { authenticator } from "otplib";

export function generateMfaSecret(): string {
  return authenticator.generateSecret(20);
}

export function generateQRCodeValue(
  secret: string,
  email: string,
  issuerName: string
): string {
  const issuer = isProd() ? issuerName : `${issuerName} - ${getAppEnv()}`;
  return authenticator.keyuri(email, issuer, secret);
}

export function verifyMfaCode(secret: string, code: string): boolean {
  return authenticator.check(code, secret);
}
