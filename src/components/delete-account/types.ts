export interface DeleteAccountServiceInterface {
  deleteServiceData: (
    user_id: string,
    access_token: string,
    email: string,
    source_ip: string,
    session_id: string,
    persistent_session_id: string,
    public_subject_id: string,
    legacy_subject_id: string,
    topic_arn?: string,
  ) => Promise<void>;
}
