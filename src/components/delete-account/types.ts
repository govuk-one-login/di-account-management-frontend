import { RequestConfig } from "../../utils/http.js";

export interface DeleteAccountServiceInterface {
  deleteAccount: (
    email: string,
    requestConfig: RequestConfig
  ) => Promise<boolean>;
  publishToDeleteTopic: (
    user_id: string,
    public_subject_id: string,
    legacy_subject_id?: string,
    topic_arn?: string
  ) => Promise<void>;
}
