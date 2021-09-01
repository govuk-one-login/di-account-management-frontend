export interface EnterNewEmailServiceInterface {
  updateEmail: (
    token: string,
    email: string,
    newEmail: string
  ) => Promise<void>;
}
