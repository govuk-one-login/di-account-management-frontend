import {
  getRequestConfig,
  Http,
  http,
  createApiResponse,
} from "../../utils/http.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants.js";
import { ChangePasswordServiceInterface } from "./types.js";
import { ApiResponse, ApiResponseResult } from "../../utils/types.js";

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
    clientSessionId: string,
    txmaAuditEncoded: string
  ): Promise<ApiResponseResult> {
    const response = await axios.client.post<ApiResponse>(
      API_ENDPOINTS.UPDATE_PASSWORD,
      {
        email,
        newPassword,
      },
      getRequestConfig({
        token: accessToken,
        validationStatuses: [
          HTTP_STATUS_CODES.NO_CONTENT,
          HTTP_STATUS_CODES.BAD_REQUEST,
        ],
        sourceIp,
        persistentSessionId,
        sessionId,
        userLanguage,
        clientSessionId,
        txmaAuditEncoded,
      })
    );
    return createApiResponse(response, [HTTP_STATUS_CODES.NO_CONTENT]);
  };

  return {
    updatePassword,
  };
}
