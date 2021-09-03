export interface EnterPasswordServiceInterface {
  authenticated: (
    token: string,
    email: string,
    password: string
  ) => Promise<boolean>;
}
