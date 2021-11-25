export interface DeleteAccountServiceInterface {
  deleteAccount: (
    token: string,
    email: string,
    sourceIp: string,
    persistentSessionId: string
  ) => Promise<void>;
}
