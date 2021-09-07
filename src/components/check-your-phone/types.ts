export interface CheckYourPhoneServiceInterface {
  updatePhoneNumber: (
    accessToken: string,
    email: string,
    phoneNumber: string,
    otp: string
  ) => Promise<boolean>;
}
