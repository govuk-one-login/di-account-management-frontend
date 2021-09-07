export interface ChangeEmailServiceInterface {
  sendCodeVerificationNotification: (
    accessToken: string,
    email: string,
    notificationType: string
  ) => Promise<boolean>;
}
