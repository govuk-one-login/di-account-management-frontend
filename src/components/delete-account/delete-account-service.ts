import {
  getBaseRequestConfig,
  Http,
  http,
} from "../../utils/http";
import {API_ENDPOINTS} from "../../app.constants";

import {DeleteAccountServiceInterface} from "./types";

export function deleteAccountService(
    axios: Http = http
): DeleteAccountServiceInterface {
  const deleteAccount = async function (
      token: string,
      email: string
  ): Promise<void> {
      const config = getBaseRequestConfig(token);
      await axios.client.post<void>(
          API_ENDPOINTS.DELETE_ACCOUNT,
          {
              email: email
          },
          config
      );
  };

  return {
      deleteAccount
  };
}
