import { RequestConfig } from "../../utils/http.js";
import { ERROR_CODES } from "../../app.constants.js";

type ErrorCodeValues = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

export interface SendCodeVerificationNotificationOutcomeSuccess {
  success: true;
  responseCode?: never;
  responseMessage?: never;
}

export interface SendCodeVerificationNotificationOutcomeFailure {
  success: false;
  responseCode: ErrorCodeValues;
  responseMessage: string;
}

export type SendCodeVerificationNotificationOutcome =
  | SendCodeVerificationNotificationOutcomeSuccess
  | SendCodeVerificationNotificationOutcomeFailure;

export interface ChangeEmailServiceInterface {
  sendCodeVerificationNotification: (
    email: string,
    requestConfig: RequestConfig
  ) => Promise<SendCodeVerificationNotificationOutcome>;
}
