export interface DeleteAccountServiceInterface {
  deleteAccount: (token: string, email: string, sourceIp: string) => Promise<void>;
}
