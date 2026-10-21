import {
  API_ENDPOINTS,
  HTTP_STATUS_CODES,
  NOTIFICATION_TYPE,
} from "../../app.constants.js";
import {
  getRequestConfig,
  Http,
  http,
  RequestConfig,
} from "../../utils/http.js";
import {
  ChangeEmailServiceInterface,
  SendCodeVerificationNotificationOutcome,
} from "./types.js";

export function changeEmailService(
  fetchClient: Http = http
): ChangeEmailServiceInterface {
  const sendCodeVerificationNotification = async function (
    email: string,
    requestConfig: RequestConfig
  ): Promise<SendCodeVerificationNotificationOutcome> {
    const response = await fetchClient.post(
      API_ENDPOINTS.SEND_NOTIFICATION,
      {
        email: email,
        notificationType: NOTIFICATION_TYPE.VERIFY_EMAIL,
      },
      getRequestConfig({
        ...requestConfig,
        validationStatuses: [
          HTTP_STATUS_CODES.NO_CONTENT,
          HTTP_STATUS_CODES.BAD_REQUEST,
        ],
      })
    );

    if (response.status === HTTP_STATUS_CODES.NO_CONTENT) {
      return { success: true };
    } else {
      const data = await response.json();
      return {
        success: false,
        responseCode: data.code,
        responseMessage: data.message,
      };
    }
  };

  return {
    sendCodeVerificationNotification,
  };
}
