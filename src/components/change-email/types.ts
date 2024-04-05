export interface ChangeEmailServiceInterface {
  sendCodeVerificationNotification: (
    accessToken: string,
    email: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string,
    userLanguage: string,
    clientSessionId: string
  ) => Promise<boolean>;
}
