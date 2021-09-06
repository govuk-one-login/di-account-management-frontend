import { amHttp, getBaseRequestConfig, Http, http } from "../../utils/http";
import { EnterPasswordServiceInterface } from "./types";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants";

export function enterPasswordService(
  axios: Http = amHttp
): EnterPasswordServiceInterface {
  const authenticated = async function (
    token: string,
    emailAddress: string,
    password: string
  ): Promise<boolean> {
    const config = getBaseRequestConfig(token);
    config.validateStatus = function (status: any) {
      return (
        status === HTTP_STATUS_CODES.OK ||
        status === HTTP_STATUS_CODES.FORBIDDEN ||
        status === HTTP_STATUS_CODES.UNAUTHORIZED
      );
    };
    const { status } = await axios.client.post<void>(
      API_ENDPOINTS.AUTHENTICATE,
      {
        email: emailAddress,
        password: password,
      },
      config
    );
    return status === HTTP_STATUS_CODES.OK;
  };
  return {
    authenticated,
  };
}