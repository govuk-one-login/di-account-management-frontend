import { getRequestConfig, Http, http } from "../../utils/http";
import { API_ENDPOINTS } from "../../app.constants";
import { snsService } from "../../utils/sns";
import { SnsService } from "../../utils/types";
import { getSNSDeleteTopic } from "../../config";

import { DeleteAccountServiceInterface } from "./types";

export function deleteAccountService(
  axios: Http = http,
  sns: SnsService = snsService()
): DeleteAccountServiceInterface {
  const deleteAccount = async function (
    token: string,
    email: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string
  ): Promise<void> {
    await axios.client.post<void>(
      API_ENDPOINTS.DELETE_ACCOUNT,
      {
        email: email,
      },
      getRequestConfig(token, null, sourceIp, persistentSessionId, sessionId)
    );
  };

  const deleteServiceData = async function (
    user_id: string,
    topic_arn: string = getSNSDeleteTopic(),
  ): Promise<void> {
    await sns.publish(topic_arn, JSON.stringify({"user_id": user_id}))
  };

  return {
    deleteAccount,
    deleteServiceData,
  };
}
