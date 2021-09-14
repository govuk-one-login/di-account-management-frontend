export interface CheckYourEmailServiceInterface {
  updateEmail: (
    accessToken: string,
    existingEmailAddress: string,
    replacementEmailAddress: string,
    code: string
  ) => Promise<boolean>;
}
