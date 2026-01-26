import { getAppEnv, isProd } from "../../config";
import { NobleCryptoPlugin, ScureBase32Plugin, TOTP } from "otplib";

const totp = new TOTP({
  crypto: new NobleCryptoPlugin(),
  base32: new ScureBase32Plugin(),
});

export function generateMfaSecret(): string {
  return totp.generateSecret();
}

export function generateQRCodeValue(
  secret: string,
  email: string,
  issuerName: string
): string {
  const issuer = isProd() ? issuerName : `${issuerName} - ${getAppEnv()}`;
  return totp.toURI({ secret, label: email, issuer });
}

export async function verifyMfaCode(
  secret: string,
  code: string
): Promise<boolean> {
  const result = await totp.verify(code, { secret });
  return result.valid;
}
