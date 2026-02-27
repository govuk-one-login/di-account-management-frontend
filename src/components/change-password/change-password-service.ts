import {
  getRequestConfig,
  Http,
  http,
  createApiResponse,
  RequestConfig,
} from "../../utils/http.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants.js";
import { ChangePasswordServiceInterface } from "./types.js";
import { ApiResponse, ApiResponseResult } from "../../utils/types.js";

export function changePasswordService(
  axios: Http = http
): ChangePasswordServiceInterface {
  const updatePassword = async function (
    email: string,
    newPassword: string,
    requestConfig: RequestConfig
  ): Promise<ApiResponseResult> {
    const response = await axios.client.post<ApiResponse>(
      API_ENDPOINTS.UPDATE_PASSWORD,
      {
        email,
        newPassword,
      },
      getRequestConfig({
        ...requestConfig,
        validationStatuses: [
          HTTP_STATUS_CODES.NO_CONTENT,
          HTTP_STATUS_CODES.BAD_REQUEST,
        ],
      })
    );
    return createApiResponse(response, [HTTP_STATUS_CODES.NO_CONTENT]);
  };

  return {
    updatePassword,
  };
}
