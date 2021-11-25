import { getRequestConfig, Http, http } from "../../utils/http";
import { API_ENDPOINTS } from "../../app.constants";

import { DeleteAccountServiceInterface } from "./types";

export function deleteAccountService(
  axios: Http = http
): DeleteAccountServiceInterface {
  const deleteAccount = async function (
    token: string,
    email: string,
    sourceIp: string,
    persistentSessionId: string
  ): Promise<void> {
    await axios.client.post<void>(
      API_ENDPOINTS.DELETE_ACCOUNT,
      {
        email: email,
      },
      getRequestConfig(token, null, sourceIp, persistentSessionId)
    );
  };

  return {
    deleteAccount,
  };
}
