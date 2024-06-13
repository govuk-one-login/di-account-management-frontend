import { getRequestConfig, Http, http } from "../../utils/http.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants.js";
import { snsService } from "../../utils/sns.js";
import { SnsService } from "../../utils/types.js";
import { getSNSDeleteTopic } from "../../config.js";

import { DeleteAccountServiceInterface } from "./types.js";

export function deleteAccountService(
  axios: Http = http,
  sns: SnsService = snsService()
): DeleteAccountServiceInterface {
  const deleteAccount = async function (
    token: string,
    email: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string,
    clientSessionId: string,
    txmaAuditEncoded: string
  ): Promise<boolean> {
    const { status } = await axios.client.post<void>(
      API_ENDPOINTS.DELETE_ACCOUNT,
      {
        email: email,
      },
      getRequestConfig({
        token,
        sourceIp,
        persistentSessionId,
        sessionId,
        clientSessionId,
        txmaAuditEncoded,
      })
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
