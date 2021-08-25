export interface UserPassword {
  isValidPassword: boolean;
  sessionState: string;
}

export interface EnterPasswordServiceInterface {
  checkUserPassword: (
    token: string,
    email: string,
    password: string
  ) => Promise<UserPassword>;
}
