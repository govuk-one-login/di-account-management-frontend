import { RequestConfig } from "../../utils/http.js";
import { ERROR_CODES } from "../../app.constants.js";
import { ApiResponseResult } from "../../utils/types.js";

type ErrorCodeValues = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface SendCodeVerificationNotificationOutcomeSuccess {
  success: boolean;
  code?: never;
  message?: never;
}

export interface SendCodeVerificationNotificationOutcomeFailure {
  success: boolean;
  code: ErrorCodeValues;
  message: string;
}

export type SendCodeVerificationNotificationOutcome =
  | SendCodeVerificationNotificationOutcomeSuccess
  | SendCodeVerificationNotificationOutcomeFailure;

export interface ChangeEmailServiceInterface {
  sendCodeVerificationNotification: (
    email: string,
    requestConfig: RequestConfig
  ) => Promise<ApiResponseResult>;
}
