export interface CheckYourEmailServiceInterface {
  updateEmail: (
    accessToken: string,
    existingEmailAddress: string,
    replacementEmailAddress: string,
    code: string,
    sourceIp: string,
    persistentSessionId: string
  ) => Promise<boolean>;
}
