import { getBaseRequestConfig, Http, http } from "../../utils/http";
import { API_ENDPOINTS, NOTIFICATION_TYPE } from "../../app.constants";
import { ChangePhoneNumberServiceInterface } from "./types";

export function changePhoneNumberService(
  axios: Http = http
): ChangePhoneNumberServiceInterface {
  const sendPhoneVerificationNotification = async function (
    accessToken: string,
    email: string,
    phoneNumber: string
  ): Promise<void> {
    await axios.client.post<void>(
      API_ENDPOINTS.SEND_NOTIFICATION,
      {
        email,
        phoneNumber,
        notificationType: NOTIFICATION_TYPE.VERIFY_PHONE_NUMBER,
      },
      getBaseRequestConfig(accessToken)
    );
  };

  return {
    sendPhoneVerificationNotification: sendPhoneVerificationNotification,
  };
}
