export interface EnterPasswordServiceInterface {
  authenticated: (
    token: string,
    email: string,
    password: string,
    sourceIp: string,
    persistentSessionId: string
  ) => Promise<boolean>;
}
