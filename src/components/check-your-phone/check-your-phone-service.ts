import { createApiResponse, getRequestConfig, Http, http } from "../../utils/http";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants";
import { CheckYourPhoneServiceInterface } from "./types";
import {ApiResponseResult} from "../../utils/types";

export function checkYourPhoneService(
  axios: Http = http
): CheckYourPhoneServiceInterface {
  const updatePhoneNumber = async function (
    accessToken: string,
    email: string,
    phoneNumber: string,
    otp: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string
  ): Promise<ApiResponseResult> {
    const response = await axios.client.post<void>(
      API_ENDPOINTS.UPDATE_PHONE_NUMBER,
      {
        email,
        otp,
        phoneNumber,
      },
      getRequestConfig(
        accessToken,
        [HTTP_STATUS_CODES.NO_CONTENT, HTTP_STATUS_CODES.BAD_REQUEST],
        sourceIp,
        persistentSessionId,
        sessionId
      )
    );

    return createApiResponse(response, [HTTP_STATUS_CODES.NO_CONTENT]);
  };

  return {
    updatePhoneNumber,
  };
}
