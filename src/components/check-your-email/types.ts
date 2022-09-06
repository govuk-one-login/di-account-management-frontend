export interface CheckYourEmailServiceInterface {
  updateEmail: (
    accessToken: string,
    existingEmailAddress: string,
    replacementEmailAddress: string,
    code: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string,
    userLanguage: string
  ) => Promise<boolean>;
}
