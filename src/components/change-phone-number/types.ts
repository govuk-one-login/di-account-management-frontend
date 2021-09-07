export interface ChangePhoneNumberServiceInterface {
  sendPhoneVerificationNotification: (
    accessToken: string,
    email: string,
    phoneNumber: string
  ) => Promise<void>;
}
