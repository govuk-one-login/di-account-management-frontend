import { getBaseRequestConfig, Http, http } from "../../utils/http";
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
    const config = getBaseRequestConfig(accessToken);
    config.validateStatus = (status: number) =>
      status === HTTP_STATUS_CODES.OK ||
      status === HTTP_STATUS_CODES.BAD_REQUEST;

    const { status } = await axios.client.post<void>(
      API_ENDPOINTS.UPDATE_PHONE_NUMBER,
      {
        email,
        otp,
        phoneNumber,
      },
      config
    );

    return status === HTTP_STATUS_CODES.OK;
  };

  return {
    updatePhoneNumber,
  };
}
