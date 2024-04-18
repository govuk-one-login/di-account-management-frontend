export interface DeleteAccountServiceInterface {
  deleteAccount: (
    token: string,
    email: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string,
    clientSessionId: string,
    txmaAuditEncoded: string
  ) => Promise<boolean>;
  publishToDeleteTopic: (
    user_id: string,
    public_subject_id: string,
    legacy_subject_id?: string,
    topic_arn?: string
  ) => Promise<void>;
}
