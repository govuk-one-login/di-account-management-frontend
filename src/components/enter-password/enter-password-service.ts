import { getRequestConfig, http, Http, createApiResponse } from "../../utils/http";
import { EnterPasswordServiceInterface } from "./types";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants";
import { ApiResponse, ApiResponseResult } from "../../utils/types";

export function enterPasswordService(
  axios: Http = http
): EnterPasswordServiceInterface {
  const authenticated = async function (
    token: string,
    emailAddress: string,
    password: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string
    ): Promise<ApiResponseResult> {
    const response = await axios.client.post<ApiResponse>(
      API_ENDPOINTS.AUTHENTICATE,
      {
        email: emailAddress,
        password: password,
      },
      getRequestConfig(
        token,
        [
          HTTP_STATUS_CODES.NO_CONTENT,
          HTTP_STATUS_CODES.FORBIDDEN,
          HTTP_STATUS_CODES.UNAUTHORIZED,
        ],
        sourceIp,
        persistentSessionId,
        sessionId
      )
    );
    return createApiResponse(response, [HTTP_STATUS_CODES.NO_CONTENT]);
  };
  return {
    authenticated,
  };
}
