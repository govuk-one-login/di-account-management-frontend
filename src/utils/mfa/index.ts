import { HTTP_STATUS_CODES, METHOD_MANAGEMENT_API } from "../../app.constants";
import { logger } from "../logger";
import { getRequestConfig, Http } from "../http";
import { MfaMethod, ProblemDetail, ValidationProblem } from "./types";
import { getMfaServiceUrl } from "../../config";

async function mfa(
  accessToken: string,
  email: string,
  sourceIp: string,
  sessionId: string,
  persistentSessionId: string
): Promise<MfaMethod[]> {
  let data: MfaMethod[] = [];
  try {
    const response = await postRequest(
      accessToken,
      email,
      sourceIp,
      sessionId,
      persistentSessionId
    );

    if (response.status === HTTP_STATUS_CODES.OK) {
      data = response.data;
    }
  } catch (err) {
    errorHandler(err, sessionId);
  }
  return data;
}

async function postRequest(
  accessToken: string,
  email: string,
  sourceIp: string,
  sessionId: string,
  persistentSessionId: string,
  http: Http = new Http(getMfaServiceUrl())
): Promise<{
  status: number;
  data: MfaMethod[];
}> {
  return http.client.post<MfaMethod[]>(
    METHOD_MANAGEMENT_API.MFA_RETRIEVE,
    {
      email,
    },
    getRequestConfig(
      accessToken,
      null,
      sourceIp,
      persistentSessionId,
      sessionId
    )
  );
}

function errorHandler(error: any, trace: string): void {
  if (!error.response || !error.response.status) {
    logger.error(
      { trace },
      `Failed to retrieve from MFA endpoint ${error.message}`
    );
    return;
  }

  const { status, data } = error.response;

  switch (status) {
    case 400: {
      const validationProblem: ValidationProblem = data;
      if (validationProblem.errors && validationProblem.errors.length > 0) {
        validationProblem.errors.forEach((error) => {
          logger.error(
            { trace },
            `Failed to retrieve from MFA endpoint ${error.detail}`
          );
        });
      } else {
        logger.error(
          { trace },
          `Failed to retrieve from MFA endpoint ${validationProblem.title}`
        );
      }
      break;
    }
    case 404:
    case 500: {
      const problemDetail: ProblemDetail = data;
      logger.error(
        { trace },
        `Failed to retrieve from MFA endpoint - Detail: ${problemDetail.detail}`
      );
      if (problemDetail.extension && problemDetail.extension.error) {
        logger.error(
          { trace },
          `Failed to retrieve from MFA endpoint - Error code: ${problemDetail.extension.error.code}`
        );
      }
      break;
    }
    default:
      logger.error(
        { trace },
        `Failed to retrieve from MFA endpoint - Unexpected error: ${error.message}`
      );
  }
}

export default mfa;
