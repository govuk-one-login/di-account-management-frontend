export interface ChangeEmailServiceInterface {
  sendCodeVerificationNotification: (
    accessToken: string,
    email: string,
    notificationType: string,
    sourceIp: string,
    persistentSessionId: string
  ) => Promise<boolean>;
}
