import { getRequestConfig, http, Http, RequestConfig } from "../../utils/http";
import { EnterPasswordServiceInterface } from "./types";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants";

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
    email: string,
    password: string,
    requestConfig: RequestConfig
  ): Promise<{ authenticated: boolean; intervention?: string }> => {
    const response = await axios.client.post(
      API_ENDPOINTS.AUTHENTICATE,
      { email: email, password },
      getRequestConfig({
        ...requestConfig,
        validationStatuses: [
          HTTP_STATUS_CODES.NO_CONTENT,
          HTTP_STATUS_CODES.FORBIDDEN,
          HTTP_STATUS_CODES.UNAUTHORIZED,
        ],
      })
    );

    const { status } = response;

    if (status === HTTP_STATUS_CODES.FORBIDDEN) {
      const intervention = getInterventionFromError(response);
      if (intervention) {
        return { authenticated: false, intervention };
      }
    }

    return { authenticated: status === HTTP_STATUS_CODES.NO_CONTENT };
  };

  return { authenticated };
}
