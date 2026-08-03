import { CookieOptions } from "express-session";

/**
 * Builds the express-session cookie options.
 *
 * When `maxAge` is omitted (or undefined), the cookie is session-scoped:
 * no `maxAge`/`expires` attribute is set, so the browser deletes the cookie
 * when it is closed rather than it persisting for a fixed duration.
 *
 * Passing a `maxAge` (in milliseconds) opts back into a persistent cookie
 * that expires after that duration, as before.
 *
 * Server-side session lifetime is controlled separately by the session
 * store's TTL, regardless of whether the cookie itself is session-scoped.
 */
export function getSessionCookieOptions(
  isProdEnv: boolean,
  maxAge?: number
): CookieOptions {
  const options: CookieOptions = {
    secure: isProdEnv,
  };

  if (typeof maxAge === "number") {
    options.maxAge = maxAge;
  }

  return options;
}
