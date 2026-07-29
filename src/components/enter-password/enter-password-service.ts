import {
  getRequestConfig,
  http,
  Http,
  RequestConfig,
} from "../../utils/http.js";
import { EnterPasswordServiceInterface } from "./types.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants.js";

const interventionMap: Record<string, string> = {
  "1083": "SUSPENDED",
  "1084": "BLOCKED",
};

async function getInterventionFromError(
  response: any
): Promise<string | undefined> {
  try {
    const clonedResponse = response.clone();
    const data = await clonedResponse.json();
    return interventionMap[data?.code];
  } catch {
    return undefined;
  }
}

export function enterPasswordService(
  fetchClient: Http = http
): EnterPasswordServiceInterface {
  const authenticated = async (
    email: string,
    password: string,
    requestConfig: RequestConfig
  ): Promise<{ authenticated: boolean; intervention?: string }> => {
    const response = await fetchClient.post(
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
      const intervention = await getInterventionFromError(response);
      if (intervention) {
        return { authenticated: false, intervention };
      }
    }

    return { authenticated: status === HTTP_STATUS_CODES.NO_CONTENT };
  };

  return { authenticated };
}
