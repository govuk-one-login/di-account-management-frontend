import { UserJourney } from "./utils/state-machine";

const SECURITY_CODE_ERROR = "actionType";

export const PATH_DATA: {
  [key: string]: { url: string; event?: string; type?: UserJourney };
} = {
  MANAGE_YOUR_ACCOUNT: { url: "/manage-your-account" },
  ENTER_PASSWORD: { url: "/enter-password" },
  CHANGE_EMAIL: {
    url: "/change-email",
    event: "VERIFY_CODE_SENT",
    type: UserJourney.ChangeEmail,
  },
  CHECK_YOUR_EMAIL: {
    url: "/check-your-email",
    event: "VALUE_UPDATED",
    type: UserJourney.ChangeEmail,
  },
  REQUEST_NEW_CODE_EMAIL: {
    url: "/request-new-email-code",
    event: "RESEND_CODE",
    type: UserJourney.ChangeEmail,
  },
  EMAIL_UPDATED_CONFIRMATION: {
    url: "/email-updated-confirmation",
    event: "CONFIRMATION",
    type: UserJourney.ChangeEmail,
  },
  CHANGE_PASSWORD: {
    url: "/change-password",
    event: "VALUE_UPDATED",
    type: UserJourney.ChangePassword,
  },
  PASSWORD_UPDATED_CONFIRMATION: {
    url: "/password-updated-confirmation",
    event: "CONFIRMATION",
    type: UserJourney.ChangePassword,
  },
  CHANGE_PHONE_NUMBER: {
    url: "/change-phone-number",
    event: "VERIFY_CODE_SENT",
    type: UserJourney.ChangePhoneNumber,
  },
  CHECK_YOUR_PHONE: {
    url: "/check-your-phone",
    event: "VALUE_UPDATED",
    type: UserJourney.ChangePhoneNumber,
  },
  REQUEST_NEW_CODE_OTP: {
    url: "/request-new-opt-code",
    event: "RESEND_CODE",
    type: UserJourney.ChangePhoneNumber,
  },
  PHONE_NUMBER_UPDATED_CONFIRMATION: {
    url: "/phone-number-updated-confirmation",
    event: "CONFIRMATION",
    type: UserJourney.ChangePhoneNumber,
  },
  DELETE_ACCOUNT: {
    url: "/delete-account",
    event: "VALUE_UPDATED",
    type: UserJourney.DeleteAccount,
  },
  ACCOUNT_DELETED_CONFIRMATION: {
    url: "/account-deleted-confirmation",
    event: "CONFIRMATION",
    type: UserJourney.DeleteAccount,
  },
  AUTH_CALLBACK: { url: "/auth/callback" },
  SESSION_EXPIRED: { url: "/session-expired" },
  SIGN_OUT: { url: "/sign-out" },
  START: { url: "/" },
  HEALTHCHECK: { url: "/healthcheck" },
  GLOBAL_LOGOUT: { url: "/global-logout" },
  SECURITY_CODE_REQUEST_EXCEEDED: { url : "/security-code-requested-too-many-times" },
  SECURITY_CODE_WAIT: { url : "/security-code-invalid-request" },
  SECURITY_CODE_INVALID: { url : "/security-code-invalid" },
};

export const API_ENDPOINTS = {
  AUTHENTICATE: "/authenticate",
  DELETE_ACCOUNT: "/delete-account",
  SEND_NOTIFICATION: "/send-otp-notification",
  UPDATE_PASSWORD: "/update-password",
  UPDATE_EMAIL: "/update-email",
  UPDATE_PHONE_NUMBER: "/update-phone-number",
  ALPHA_GOV_ACCOUNT: "/api/oidc-users/",
};

export enum NOTIFICATION_TYPE {
  VERIFY_EMAIL = "VERIFY_EMAIL",
  VERIFY_PHONE_NUMBER = "VERIFY_PHONE_NUMBER",
}

export const VECTORS_OF_TRUST = {
  MEDIUM: "Cl.Cm",
  LOW: "Cl",
};

export const HTTP_STATUS_CODES = {
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  OK: 200,
  NO_CONTENT: 204,
  REDIRECT: 303,
};

export enum LOCALE {
  EN = "en",
  CY = "cy",
}

export const ERROR_MESSAGES = {
  FAILED_HTTP_REQUEST: "Failed HTTP request",
  INVALID_CSRF_TOKEN: "Invalid CSRF token",
  INVALID_SESSION: "Invalid session",
  INVALID_HTTP_REQUEST: "Invalid HTTP request",
  FORBIDDEN: "Unauthorized HTTP request",
  INTERNAL_SERVER_ERROR: "Internal server error",
  PAGE_NOT_FOUND: "Request page not found",
};

export const ERROR_CODES = {
  NEW_PASSWORD_SAME_AS_EXISTING: 1024,
  NEW_PHONE_NUMBER_SAME_AS_EXISTING: 1044,
  VERIFY_PHONE_NUMBER_MAX_CODES_SENT: 1032,
  VERIFY_PHONE_NUMBER_CODE_REQUEST_BLOCKED: 1030,
  ENTERED_INVALID_VERIFY_PHONE_NUMBER_CODE_MAX_TIMES: 1034,
  INVALID_OTP_CODE: 1020,
};

export const ENVIRONMENT_NAME = {
  PROD: "production",
  DEV: "development",
};

export enum SecurityCodeErrorType {
  OtpMaxCodesSent = "otpMaxCodesSent",
  OtpBlocked = "otpBlocked",
  OtpMaxRetries = "otpMaxRetries",
}

export const ERROR_CODE_MAPPING: { [p: string]: string } = {
  [ERROR_CODES.VERIFY_PHONE_NUMBER_MAX_CODES_SENT]: pathWithQueryParam(
      PATH_DATA["SECURITY_CODE_REQUEST_EXCEEDED"].url,
      SECURITY_CODE_ERROR,
      SecurityCodeErrorType.OtpMaxCodesSent
  ),
  [ERROR_CODES.VERIFY_PHONE_NUMBER_CODE_REQUEST_BLOCKED]: pathWithQueryParam(
      PATH_DATA["SECURITY_CODE_WAIT"].url,
      SECURITY_CODE_ERROR,
      SecurityCodeErrorType.OtpBlocked
  ),
  [ERROR_CODES.ENTERED_INVALID_VERIFY_PHONE_NUMBER_CODE_MAX_TIMES]:
      pathWithQueryParam(
          PATH_DATA["SECURITY_CODE_INVALID"].url,
          SECURITY_CODE_ERROR,
          SecurityCodeErrorType.OtpMaxRetries
      ),
};

function pathWithQueryParam(
    path: string,
    queryParam?: string,
    value?: string | SecurityCodeErrorType
) {
  if (queryParam && value) {
    const queryParams = new URLSearchParams({
      [queryParam]: value,
    }).toString();

    return path + "?" + queryParams;
  }

  return path;
}

export function getErrorPathByCode(errorCode: number): string | undefined {
  const nextPath = ERROR_CODE_MAPPING[errorCode.toString()];

  if (!nextPath) {
    return undefined;
  }

  return nextPath;
}
