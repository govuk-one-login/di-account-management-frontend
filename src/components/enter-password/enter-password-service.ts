import {
  getRequestConfig,
  http,
  Http,
  RequestConfig,
} from "../../utils/http.js";
import { EnterPasswordServiceInterface } from "./types.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants.js";

async function getInterventionCodeFromError(response: any): Promise<number> {
  const clonedResponse = response.clone();
  const data = await clonedResponse.json();
  return data?.code;
}

export function enterPasswordService(
  fetchClient: Http = http
): EnterPasswordServiceInterface {
  const authenticated = async (
    email: string,
    password: string,
    requestConfig: RequestConfig
  ): Promise<{
    authenticated: boolean;
    hasIntervention?: boolean;
    responseCode?: number;
    responseMessage?: string;
  }> => {
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
    if (status === HTTP_STATUS_CODES.NO_CONTENT) {
      return { authenticated: true };
    }

    if (status === HTTP_STATUS_CODES.FORBIDDEN) {
      const interventionCode = await getInterventionCodeFromError(response);
      return {
        authenticated: false,
        hasIntervention: true,
        responseCode: interventionCode,
      };
    }

    const data = await response.json();

    return {
      authenticated: false,
      responseCode: data?.code,
      responseMessage: data?.message,
    };
  };

  return { authenticated };
}
