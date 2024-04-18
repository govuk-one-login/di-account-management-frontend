import { getRequestConfig, http, Http } from "../../utils/http";
import { EnterPasswordServiceInterface } from "./types";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants";

export function enterPasswordService(
  axios: Http = http
): EnterPasswordServiceInterface {
  const authenticated = async function (
    token: string,
    emailAddress: string,
    password: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string,
    clientSessionId: string,
    txmaAuditEncoded: string
  ): Promise<boolean> {
    const { status } = await axios.client.post<void>(
      API_ENDPOINTS.AUTHENTICATE,
      {
        email: emailAddress,
        password: password,
      },
      getRequestConfig({
        token,
        validationStatuses: [
          HTTP_STATUS_CODES.NO_CONTENT,
          HTTP_STATUS_CODES.FORBIDDEN,
          HTTP_STATUS_CODES.UNAUTHORIZED,
        ],
        sourceIp,
        persistentSessionId,
        sessionId,
        clientSessionId,
        txmaAuditEncoded,
      })
    );
    return status === HTTP_STATUS_CODES.NO_CONTENT;
  };
  return {
    authenticated,
  };
}
