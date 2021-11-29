export interface CheckYourPhoneServiceInterface {
  updatePhoneNumber: (
    accessToken: string,
    email: string,
    phoneNumber: string,
    otp: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string
  ) => Promise<boolean>;
}
