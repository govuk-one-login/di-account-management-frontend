export interface ChangeEmailServiceInterface {
  sendCodeVerificationNotification: (
    accessToken: string,
    email: string,
    notificationType: string,
    sourceIp: string
  ) => Promise<boolean>;
}
