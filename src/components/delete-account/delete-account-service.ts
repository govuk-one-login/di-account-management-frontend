import {
  getRequestConfig,
  Http,
  http,
  RequestConfig,
} from "../../utils/http.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants.js";

import { DeleteAccountServiceInterface } from "./types.js";

export function deleteAccountService(
  fetchClient: Http = http
): DeleteAccountServiceInterface {
  const deleteAccount = async function (
    email: string,
    requestConfig: RequestConfig
  ): Promise<boolean> {
    const { status } = await fetchClient.post(
      API_ENDPOINTS.DELETE_ACCOUNT,
      {
        email: email,
      },
      getRequestConfig(requestConfig)
    );
    return status === HTTP_STATUS_CODES.NO_CONTENT;
  };

  return {
    deleteAccount,
  };
}
