import { getRequestConfig, Http, http } from "../../utils/http";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants";
import { CheckYourPhoneServiceInterface } from "./types";

export function checkYourPhoneService(
  axios: Http = http
): CheckYourPhoneServiceInterface {
  const updatePhoneNumber = async function (
    accessToken: string,
    email: string,
    phoneNumber: string,
    otp: string
  ): Promise<boolean> {
    const { status } = await axios.client.post<void>(
      API_ENDPOINTS.UPDATE_PHONE_NUMBER,
      {
        email,
        otp,
        phoneNumber,
      },
      getRequestConfig(accessToken, [
        HTTP_STATUS_CODES.NO_CONTENT,
        HTTP_STATUS_CODES.BAD_REQUEST,
      ])
    );

    return status === HTTP_STATUS_CODES.NO_CONTENT;
  };

  return {
    updatePhoneNumber,
  };
}
