import {
  getRequestConfig,
  Http,
  http,
  createApiResponse,
} from "../../utils/http";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants";
import { ChangePasswordServiceInterface } from "./types";
import { ApiResponse, ApiResponseResult } from "../../utils/types";

export function changePasswordService(
  axios: Http = http
): ChangePasswordServiceInterface {
  const updatePassword = async function (
    accessToken: string,
    email: string,
    newPassword: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string,
    userLanguage: string,
    clientSessionId: string
  ): Promise<ApiResponseResult> {
    const response = await axios.client.post<ApiResponse>(
      API_ENDPOINTS.UPDATE_PASSWORD,
      {
        email,
        newPassword,
      },
      getRequestConfig(
        accessToken,
        [HTTP_STATUS_CODES.NO_CONTENT, HTTP_STATUS_CODES.BAD_REQUEST],
        sourceIp,
        persistentSessionId,
        sessionId,
        userLanguage,
        clientSessionId
      )
    );
    return createApiResponse(response, [HTTP_STATUS_CODES.NO_CONTENT]);
  };

  return {
    updatePassword,
  };
}
