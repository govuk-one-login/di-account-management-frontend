export interface ChangePhoneNumberServiceInterface {
  sendPhoneVerificationNotification: (
    accessToken: string,
    email: string,
    phoneNumber: string,
    sourceIp: string,
    persistentSessionId: string
  ) => Promise<void>;
}
