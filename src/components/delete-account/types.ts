export interface DeleteAccountServiceInterface {
  deleteAccount: (
    token: string,
    email: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string
  ) => Promise<void>;
  deleteServiceData: (
    user_id: string,
    topic_arn?: string,
  ) => Promise<void>;
}
