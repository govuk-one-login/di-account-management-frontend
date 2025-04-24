import {
  ENVIRONMENT_NAME,
  HTTP_STATUS_CODES,
  METHOD_MANAGEMENT_API,
} from "../../app.constants";
import { logger } from "../logger";
import { getRequestConfig, Http } from "../http";
import { MfaMethod, ProblemDetail, ValidationProblem } from "./types";
import { getAppEnv, getMfaServiceUrl } from "../../config";
import { authenticator } from "otplib";
import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../types";
import { format } from "util";

export function generateMfaSecret(): string {
  return authenticator.generateSecret(20);
}

export function generateQRCodeValue(
  secret: string,
  email: string,
  issuerName: string
): string {
  const issuer =
    getAppEnv() === ENVIRONMENT_NAME.PROD
      ? issuerName
      : `${issuerName} - ${getAppEnv()}`;
  return authenticator.keyuri(email, issuer, secret);
}

export function verifyMfaCode(secret: string, code: string): boolean {
  return authenticator.check(code, secret);
}

async function putRequest(
  updateInput: UpdateInformationInput,
  sessionDetails: UpdateInformationSessionValues,
  http: Http = new Http(getMfaServiceUrl())
): Promise<{
  status: number;
  data: MfaMethod;
}> {
  return await http.client.put<MfaMethod>(
    format(
      METHOD_MANAGEMENT_API.MFA_METHODS_PUT,
      updateInput.mfaMethod.mfaIdentifier
    ),
    {
      email: updateInput.email,
      credential: updateInput.updatedValue,
      otp: updateInput.otp,
      mfaMethod: updateInput.mfaMethod,
    },
    getRequestConfig({
      token: sessionDetails.accessToken,
      validationStatuses: [
        HTTP_STATUS_CODES.OK,
        HTTP_STATUS_CODES.NOT_FOUND,
        HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR,
      ],
      ...sessionDetails,
    })
  );
}

function errorHandler(error: any, trace: string, action: string): void {
  if (!error.response || !error.response.status) {
    logger.error(
      { trace },
      `Index: errorHandler: failed to ${action} MFA endpoint ${error.message}`
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
            `Index: ValidationProblem: failed to ${action} MFA endpoint ${error.detail}`
          );
        });
      } else {
        logger.error(
          { trace },
          `Index: 400 Status: failed to ${action} MFA endpoint ${validationProblem.title}`
        );
      }
      break;
    }
    case 404:
    case 500: {
      const problemDetail: ProblemDetail = data;
      logger.error(
        { trace },
        `Index: 500 Status: Failed to ${action} MFA endpoint - Detail: ${problemDetail.detail}`
      );
      if (problemDetail?.extension?.error) {
        logger.error(
          { trace },
          `Index: 500 Status: ProblemDetail: Failed to ${action} MFA endpoint - Error code: ${problemDetail.extension.error.code}`
        );
      }
      break;
    }
    default:
      logger.error(
        { trace },
        `Index: default: Failed to ${action} MFA endpoint - Unexpected error: ${error.message}`
      );
  }
}

export async function updateMfaMethod(
  updateInput: UpdateInformationInput,
  sessionDetails: UpdateInformationSessionValues
): Promise<boolean> {
  let isUpdated = false;
  try {
    const response = await putRequest(updateInput, sessionDetails);

    if (response.status === HTTP_STATUS_CODES.OK) {
      isUpdated = true;
    } else {
      errorHandler(
        new Error("MFA Method Not Found"),
        sessionDetails.sessionId,
        "update"
      );
    }
  } catch (error) {
    errorHandler(error, sessionDetails.sessionId, "update");
  }
  return isUpdated;
}
