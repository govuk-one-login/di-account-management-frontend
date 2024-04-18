import {
  API_ENDPOINTS,
  HTTP_STATUS_CODES,
  NOTIFICATION_TYPE,
} from "../../app.constants";
import { getRequestConfig, Http, http } from "../../utils/http";
import { ChangeEmailServiceInterface } from "./types";

export function changeEmailService(
  axios: Http = http
): ChangeEmailServiceInterface {
  const sendCodeVerificationNotification = async function (
    accessToken: string,
    email: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string,
    userLanguage: string,
    clientSessionId: string
  ): Promise<boolean> {
    const { status } = await axios.client.post<void>(
      API_ENDPOINTS.SEND_NOTIFICATION,
      {
        email: email,
        notificationType: NOTIFICATION_TYPE.VERIFY_EMAIL,
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
      })
    );

    return status === HTTP_STATUS_CODES.NO_CONTENT;
  };

  return {
    sendCodeVerificationNotification,
  };
}
