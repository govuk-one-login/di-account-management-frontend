export interface EnterPasswordServiceInterface {
  authenticated: (
    token: string,
    email: string,
    password: string,
    sourceIp: string
  ) => Promise<boolean>;
}
