import { getRequestConfig, http, Http } from "../../utils/http";
import { EnterPasswordServiceInterface } from "./types";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants";
import { supportChangeOnIntervention } from "../../config";

const interventionMap: Record<string, string> = {
  "1083": "SUSPENDED",
  "1084": "BLOCKED",
};

function getInterventionFromError(response: any): string | undefined {
  const code = response?.data?.code;
  return code ? interventionMap[code] : undefined;
}

export function enterPasswordService(
  axios: Http = http
): EnterPasswordServiceInterface {
  const authenticated = async (
    {
      token,
      email,
      password,
    }: { token: string; email: string; password: string },
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string,
    clientSessionId: string,
    txmaAuditEncoded: string
  ): Promise<{ authenticated: boolean; intervention?: string }> => {
    const response = await axios.client.post(
      API_ENDPOINTS.AUTHENTICATE,
      { email: email, password },
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

    const { status } = response;

    if (
      status === HTTP_STATUS_CODES.FORBIDDEN &&
      supportChangeOnIntervention()
    ) {
      const intervention = getInterventionFromError(response);
      if (intervention) {
        return { authenticated: false, intervention };
      }
    }

    return { authenticated: status === HTTP_STATUS_CODES.NO_CONTENT };
  };

  return { authenticated };
}
