import { getRequestConfig, Http, http, RequestConfig } from "../../utils/http";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants";
import { snsService } from "../../utils/sns";
import { SnsService } from "../../utils/types";
import { getSNSDeleteTopic } from "../../config";

import { DeleteAccountServiceInterface } from "./types";

export function deleteAccountService(
  axios: Http = http,
  sns: SnsService = snsService()
): DeleteAccountServiceInterface {
  const deleteAccount = async function (
    email: string,
    requestConfig: RequestConfig
  ): Promise<boolean> {
    const { status } = await axios.client.post<void>(
      API_ENDPOINTS.DELETE_ACCOUNT,
      {
        email: email,
      },
      getRequestConfig(requestConfig)
    );
    return status === HTTP_STATUS_CODES.NO_CONTENT;
  };

  const publishToDeleteTopic = async function (
    user_id: string,
    public_subject_id: string,
    legacy_subject_id: string | undefined,
    topic_arn: string = getSNSDeleteTopic()
  ): Promise<void> {
    await sns.publish(
      topic_arn,
      JSON.stringify({
        user_id: user_id,
        public_subject_id: public_subject_id,
        legacy_subject_id: legacy_subject_id,
      })
    );
  };

  return {
    deleteAccount,
    publishToDeleteTopic,
  };
}
