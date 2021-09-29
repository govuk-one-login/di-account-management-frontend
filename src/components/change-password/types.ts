export interface ChangePasswordServiceInterface {
  updatePassword: (
    accessToken: string,
    email: string,
    newPassword: string,
    sourceIp: string
  ) => Promise<void>;
}
