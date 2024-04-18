import {
  createApiResponse,
  getRequestConfig,
  Http,
  http,
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
    accessToken: string,
    email: string,
    phoneNumber: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string,
    userLanguage: string,
    clientSessionId: string
  ): Promise<ApiResponseResult> {
    const response = await axios.client.post<ApiResponse>(
      API_ENDPOINTS.SEND_NOTIFICATION,
      {
        email,
        phoneNumber,
        notificationType: NOTIFICATION_TYPE.VERIFY_PHONE_NUMBER,
      },
      getRequestConfig({
        token: accessToken,
        validationStatues: [
          HTTP_STATUS_CODES.NO_CONTENT,
          HTTP_STATUS_CODES.BAD_REQUEST,
        ],
        sourceIp,
        persistentSessionId,
        sessionId,
        userLanguage,
        clientSessionId,
      })
    );
    return createApiResponse(response, [HTTP_STATUS_CODES.NO_CONTENT]);
  };

  return {
    sendPhoneVerificationNotification,
  };
}
