import {
  createApiResponse,
  getRequestConfig,
  Http,
  http,
  RequestConfig,
} from "../../utils/http";
import {
  API_ENDPOINTS,
  HTTP_STATUS_CODES,
  NOTIFICATION_TYPE,
} from "../../app.constants";
import { ChangePhoneNumberServiceInterface } from "./types";
import { ApiResponse, ApiResponseResult } from "../../utils/types";

export function changePhoneNumberService(
  axios: Http = http
): ChangePhoneNumberServiceInterface {
  const sendPhoneVerificationNotification = async function (
    email: string,
    phoneNumber: string,
    requestConfig: RequestConfig
  ): Promise<ApiResponseResult> {
    const response = await axios.client.post<ApiResponse>(
      API_ENDPOINTS.SEND_NOTIFICATION,
      {
        email,
        phoneNumber,
        notificationType: NOTIFICATION_TYPE.VERIFY_PHONE_NUMBER,
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
    sendPhoneVerificationNotification,
  };
}
