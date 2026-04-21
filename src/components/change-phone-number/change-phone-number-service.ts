import {
  createApiResponse,
  getRequestConfig,
  Http,
  http,
  RequestConfig,
} from "../../utils/http.js";
import {
  API_ENDPOINTS,
  HTTP_STATUS_CODES,
  NOTIFICATION_TYPE,
} from "../../app.constants.js";
import { ChangePhoneNumberServiceInterface } from "./types.js";
import { ApiResponse, ApiResponseResult } from "../../utils/types.js";
import { PriorityIdentifier } from "../../utils/mfaClient/types.js";

export function changePhoneNumberService(
  axios: Http = http
): ChangePhoneNumberServiceInterface {
  const sendPhoneVerificationNotification = async function (
    email: string,
    phoneNumber: string,
    priorityIdentifier: PriorityIdentifier,
    requestConfig: RequestConfig
  ): Promise<ApiResponseResult> {
    const response = await axios.client.post<ApiResponse>(
      API_ENDPOINTS.SEND_NOTIFICATION,
      {
        email,
        phoneNumber,
        notificationType: NOTIFICATION_TYPE.VERIFY_PHONE_NUMBER,
        priorityIdentifier,
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
