import { getRequestConfig, Http, http } from "../../utils/http";
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
    code: string,
    sourceIp: string
  ): Promise<boolean> {
    const { status }: AxiosResponse = await axios.client.post(
      API_ENDPOINTS.UPDATE_EMAIL,
      {
        existingEmailAddress,
        replacementEmailAddress,
        otp: code,
      },
      getRequestConfig(accessToken, [
        HTTP_STATUS_CODES.NO_CONTENT,
        HTTP_STATUS_CODES.BAD_REQUEST,
      ], sourceIp)
    );

    return status === HTTP_STATUS_CODES.NO_CONTENT;
  };

  return {
    updateEmail,
  };
}
