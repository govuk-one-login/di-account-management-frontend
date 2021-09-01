export interface EnterNewEmailServiceInterface {
  updateEmail: (
    accessToken: string,
    email: string,
    newEmail: string
  ) => Promise<void>;
}
