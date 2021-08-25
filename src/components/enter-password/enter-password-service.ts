import { getBaseRequestConfig, Http, http } from "../../utils/http";
import { EnterPasswordServiceInterface, UserPassword } from "./types";
import { API_ENDPOINTS } from "../../app.constants";

export function enterPasswordService(
  axios: Http = http
): EnterPasswordServiceInterface {
  const checkUserPassword = async function (
    token: string,
    emailAddress: string,
    password: string
  ): Promise<UserPassword> {
    const config = getBaseRequestConfig(token);

    // TODO: this API does not exist
    const { data } = await axios.client.post<UserPassword>(
      API_ENDPOINTS.CHECK_USER_PASSWORD,
      {
        email: emailAddress,
        password: password,
      },
      config
    );
    return data;
  };
  return {
    checkUserPassword,
  };
}
