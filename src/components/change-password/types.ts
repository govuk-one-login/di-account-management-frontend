export interface ChangePasswordServiceInterface {
  updatePassword: (
    accessToken: string,
    email: string,
    newPassword: string
  ) => Promise<void>;
}
