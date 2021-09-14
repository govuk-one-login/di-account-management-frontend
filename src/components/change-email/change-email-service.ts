import {
  API_ENDPOINTS,
  HTTP_STATUS_CODES,
  NOTIFICATION_TYPE,
} from "../../app.constants";
import { getBaseRequestConfig, Http, http } from "../../utils/http";
import { ChangeEmailServiceInterface } from "./types";

export function changeEmailService(
  axios: Http = http
): ChangeEmailServiceInterface {
  const sendCodeVerificationNotification = async function (
    accessToken: string,
    email: string
  ): Promise<boolean> {
    const config = getBaseRequestConfig(accessToken);
    config.validateStatus = (status: number) =>
      status === HTTP_STATUS_CODES.OK ||
      status === HTTP_STATUS_CODES.BAD_REQUEST;

    const { status } = await axios.client.post<void>(
      API_ENDPOINTS.SEND_NOTIFICATION,
      {
        email: email,
        notificationType: NOTIFICATION_TYPE.VERIFY_EMAIL,
      },
      config
    );

    return status === HTTP_STATUS_CODES.OK;
  };

  return {
    sendCodeVerificationNotification,
  };
}
