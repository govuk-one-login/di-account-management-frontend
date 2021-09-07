import { getBaseRequestConfig, Http, http } from "../../utils/http";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants";
import { CheckYourEmailServiceInterface } from "./types";
import { AxiosResponse } from "axios";

export function checkYourEmailService(
  axios: Http = http
): CheckYourEmailServiceInterface {
  const updateEmail = async function (
    accessToken: string,
    existingEmailAddress: string,
    replacementEmailAddress: string,
    code: string
  ): Promise<boolean> {
    const config = getBaseRequestConfig(accessToken);
    config.validateStatus = (status: number) =>
      status === HTTP_STATUS_CODES.OK ||
      status === HTTP_STATUS_CODES.BAD_REQUEST;

    const { status }: AxiosResponse = await axios.client.post(
      API_ENDPOINTS.UPDATE_EMAIL,
      {
        existingEmailAddress,
        replacementEmailAddress,
        otp: code,
      },
      config
    );

    return status === HTTP_STATUS_CODES.OK;
  };

  return {
    updateEmail,
  };
}
