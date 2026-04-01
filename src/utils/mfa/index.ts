import { getAppEnv, isProd } from "../../config.js";
import { getLastNDigits } from "../phone-number.js";
import { NobleCryptoPlugin, ScureBase32Plugin, TOTP } from "otplib";
import { MfaMethod } from "../mfaClient/types.js";

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

function handleSmsMethod(
  phoneNumber: string,
  enterPasswordUrl: string,
  t: (key: string) => string,
  priorityIdentifier: string
) {
  const lastDigits = getLastNDigits(phoneNumber, 4);
  return {
    text: t(
      "pages.security.mfaSection.defaultMethod.phoneNumber.title"
    ).replace("[phoneNumber]", lastDigits),
    linkText: t("pages.security.mfaSection.defaultMethod.phoneNumber.change"),
    linkHref: `${enterPasswordUrl}&type=changePhoneNumber`,
    priorityIdentifier,
  };
}

function handleAuthAppMethod(
  enterPasswordUrl: string,
  t: (key: string) => string,
  priorityIdentifier: string
) {
  return {
    text: t("pages.security.mfaSection.defaultMethod.app.title"),
    linkText: t("pages.security.mfaSection.defaultMethod.app.change"),
    linkHref: `${enterPasswordUrl}&type=changeAuthApp`,
    priorityIdentifier,
  };
}

export function mapMfaMethods(
  mfaMethods: MfaMethod[],
  enterPasswordUrl: string,
  t: (key: string) => string
) {
  return mfaMethods.map(({ method, priorityIdentifier }) => {
    const { mfaMethodType } = method;

    if (mfaMethodType === "SMS") {
      return handleSmsMethod(
        method.phoneNumber,
        enterPasswordUrl,
        t,
        priorityIdentifier
      );
    }

    if (mfaMethodType === "AUTH_APP") {
      return handleAuthAppMethod(enterPasswordUrl, t, priorityIdentifier);
    }

    throw new Error(`Unexpected mfaMethodType: ${mfaMethodType}`);
  });
}

export function canChangePrimaryMethod(mfaMethods: MfaMethod[]): boolean {
  return (
    mfaMethods.length > 1 &&
    mfaMethods.some(
      (m) =>
        m.method.mfaMethodType === "SMS" && m.priorityIdentifier === "DEFAULT"
    ) &&
    mfaMethods.some(
      (m) =>
        m.method.mfaMethodType === "AUTH_APP" &&
        m.priorityIdentifier === "BACKUP"
    )
  );
}
