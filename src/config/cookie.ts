import { CookieOptions } from "csurf";

export function getCSRFCookieOptions(isProdEnv: boolean): CookieOptions {
  return {
    httpOnly: isProdEnv,
    secure: isProdEnv,
  };
}

export function getSessionCookieOptions(
    isProdEnv: boolean,
    expiry: number,
    secret: string
): any {
  return {
    name: "ams",
    secret: secret,
    maxAge: expiry,
    secure: isProdEnv,
  };
}
