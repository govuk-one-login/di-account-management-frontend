export interface CheckYourPhoneServiceInterface {
  updatePhoneNumber: (
    accessToken: string,
    email: string,
    phoneNumber: string,
    otp: string,
    sourceIp: string,
    persistentSessionId: string
  ) => Promise<boolean>;
}
