export interface ChangeEmailServiceInterface {
  sendCodeVerificationNotification: (
    accessToken: string,
    email: string,
    notificationType: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string,
    userLanguage: string
  ) => Promise<boolean>;
}
