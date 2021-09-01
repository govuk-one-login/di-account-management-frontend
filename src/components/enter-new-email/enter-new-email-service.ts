import { getBaseRequestConfig, Http, http } from "../../utils/http";
import { API_ENDPOINTS } from "../../app.constants";
import { EnterNewEmailServiceInterface } from "./types";

export function enterNewEmailService(
  axios: Http = http
): EnterNewEmailServiceInterface {
  const updateEmail = async function (
    token: string,
    currentEmail: string,
    newEmail: string
  ): Promise<void> {
    const config = getBaseRequestConfig(token);
    await axios.client.post<void>(
      API_ENDPOINTS.UPDATE_EMAIL,
      {
        currentEmail: currentEmail,
        newEmail: newEmail,
      },
      config
    );
  };
  return {
    updateEmail,
  };
}
