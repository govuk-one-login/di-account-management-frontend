export function getSessionCookieOptions(
  isProdEnv: boolean,
  secret: string
): any {
  return {
    name: "ams",
    secret: secret,
    secure: isProdEnv,
    maxAge: null,
  };
}
