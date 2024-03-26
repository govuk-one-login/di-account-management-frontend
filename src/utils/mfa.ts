import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../app.constants";
import { logger } from "./logger";
import { getRequestConfig, http } from "./http";
import { MfaMethod, ProblemDetail, ValidationProblem } from "./types";

async function mfa(
  accessToken: string,
  email: string,
  sourceIp: string,
  sessionId: string,
  persistentSessionId: string
): Promise<MfaMethod[]> {
  try {
    const { status, data } = await http.client.post<MfaMethod[]>(
      API_ENDPOINTS.MFA_RETRIEVE,
      {
        email,
      },
      getRequestConfig(
        accessToken,
        [
          HTTP_STATUS_CODES.NOT_FOUND,
          HTTP_STATUS_CODES.BAD_REQUEST,
          HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
        ],
        sourceIp,
        persistentSessionId,
        sessionId
      )
    );
    if (status === HTTP_STATUS_CODES.OK) {
      return data;
    }
    return [];
  } catch (err) {
    errorHandler(err, sessionId);
    return [];
  }
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
