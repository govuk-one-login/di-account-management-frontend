import { getRequestConfig, Http, http } from "../../utils/http";
import { API_ENDPOINTS } from "../../app.constants";
import { ChangePasswordServiceInterface } from "./types";

export function changePasswordService(
  axios: Http = http
): ChangePasswordServiceInterface {
  const updatePassword = async function (
    accessToken: string,
    email: string,
    newPassword: string,
    sourceIp: string
  ): Promise<void> {
    await axios.client.post<void>(
      API_ENDPOINTS.UPDATE_PASSWORD,
      {
        email,
        newPassword,
      },
      getRequestConfig(accessToken, [], sourceIp)
    );
  };

  return {
    updatePassword,
  };
}
