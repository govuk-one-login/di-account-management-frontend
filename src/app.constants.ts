import { EventType, UserJourney } from "./utils/state-machine";

export const PATH_DATA: Record<
  string,
  { url: string; event?: EventType; type?: UserJourney }
> = {
  CONTACT: { url: "/contact-gov-uk-one-login" },
  AUTH_REPORTING_FORM: {
    url: "https://signin.account.gov.uk/contact-us-questions?theme=suspect_unauthorised_access&referer=",
  },
  SIGN_IN_HISTORY: { url: "/activity-history" },
  REPORT_SUSPICIOUS_ACTIVITY: { url: "/activity-history/report-activity" },
  MANAGE_YOUR_ACCOUNT: { url: "/manage-your-account" },
  SETTINGS: { url: "/settings" },
  SECURITY: { url: "/security" },
  YOUR_SERVICES: { url: "/your-services" },
  ENTER_PASSWORD: { url: "/enter-password" },
  SEARCH_SERVICES: { url: "/search-services" },
  ADD_MFA_METHOD: {
    url: "/choose-backup",
    event: EventType.SelectedApp,
    type: UserJourney.AddMfaMethod,
  },
  ADD_MFA_METHOD_APP: {
    url: "/add-mfa-method-app",
    event: EventType.ValueUpdated,
    type: UserJourney.AddMfaMethod,
  },
  ADD_MFA_METHOD_APP_CONFIRMATION: {
    url: "/backup-auth-app-confirmation",
    event: EventType.Confirmation,
    type: UserJourney.AddMfaMethod,
  },
  ADD_MFA_METHOD_SMS: {
    url: "/add-mfa-method-sms",
    event: EventType.VerifyCodeSent,
    type: UserJourney.AddMfaMethod,
  },
  ADD_MFA_METHOD_SMS_CONFIRMATION: {
    url: "/backup-text-message-confirmation",
    event: EventType.Confirmation,
    type: UserJourney.ChangePhoneNumber,
  },
  DELETE_MFA_METHOD: {
    url: "/remove-method",
    event: EventType.RemoveBackup,
    type: UserJourney.RemoveMfaMethod,
  },
  DELETE_MFA_METHOD_CONFIRMATION: {
    url: "/remove-backup-confirmation",
    event: EventType.Confirmation,
    type: UserJourney.RemoveMfaMethod,
  },
  CHANGE_EMAIL: {
    url: "/change-email",
    event: EventType.VerifyCodeSent,
    type: UserJourney.ChangeEmail,
  },
  CHECK_YOUR_EMAIL: {
    url: "/check-your-email",
    event: EventType.ValueUpdated,
    type: UserJourney.ChangeEmail,
  },
  SWITCH_BACKUP_METHOD: {
    url: "/switch-method",
    type: UserJourney.SwitchBackupMethod,
    event: EventType.ValueUpdated,
  },
  SWITCH_BACKUP_METHOD_CONFIRMATION: {
    url: "/switch-methods-confirmation",
    type: UserJourney.SwitchBackupMethod,
    event: EventType.Confirmation,
  },
  CHANGE_DEFAULT_METHOD: {
    url: "/change-default-method",
    type: UserJourney.ChangeDefaultMethod,
    event: EventType.ValueUpdated,
  },
  CHANGE_DEFAULT_METHOD_APP: {
    url: "/change-default-method-app",
    type: UserJourney.ChangeDefaultMethod,
    event: EventType.ValueUpdated,
  },
  CHANGE_DEFAULT_METHOD_SMS: {
    url: "/change-default-method-sms",
    type: UserJourney.ChangeDefaultMethod,
    event: EventType.ValueUpdated,
  },
  CHANGE_DEFAULT_METHOD_CONFIRMATION: {
    url: "/change-default-method-confirmation",
    type: UserJourney.ChangeDefaultMethod,
    event: EventType.Confirmation,
  },
  REQUEST_NEW_CODE_EMAIL: {
    url: "/request-new-email-code",
    event: EventType.ResendCode,
    type: UserJourney.ChangeEmail,
  },
  EMAIL_UPDATED_CONFIRMATION: {
    url: "/email-updated-confirmation",
    event: EventType.Confirmation,
    type: UserJourney.ChangeEmail,
  },
  CHANGE_PASSWORD: {
    url: "/change-password",
    event: EventType.ValueUpdated,
    type: UserJourney.ChangePassword,
  },
  PASSWORD_UPDATED_CONFIRMATION: {
    url: "/password-updated-confirmation",
    event: EventType.Confirmation,
    type: UserJourney.ChangePassword,
  },
  CHANGE_PHONE_NUMBER: {
    url: "/change-phone-number",
    event: EventType.VerifyCodeSent,
    type: UserJourney.ChangePhoneNumber,
  },
  CHANGE_AUTHENTICATOR_APP: {
    url: "/change-authenticator-app",
    event: EventType.ValueUpdated,
    type: UserJourney.ChangeAuthApp,
  },
  CHECK_YOUR_PHONE: {
    url: "/check-your-phone",
    event: EventType.ValueUpdated,
    type: UserJourney.ChangePhoneNumber,
  },
  REQUEST_NEW_CODE_OTP: {
    url: "/request-new-opt-code",
    event: EventType.ResendCode,
    type: UserJourney.ChangePhoneNumber,
  },
  PHONE_NUMBER_UPDATED_CONFIRMATION: {
    url: "/phone-number-updated-confirmation",
    event: EventType.Confirmation,
    type: UserJourney.ChangePhoneNumber,
  },
  AUTHENTICATOR_APP_UPDATED_CONFIRMATION: {
    url: "/change-auth-app-confirmation",
    event: EventType.Confirmation,
    type: UserJourney.ChangeAuthApp,
  },
  DELETE_ACCOUNT: {
    url: "/delete-account",
    event: EventType.ValueUpdated,
    type: UserJourney.DeleteAccount,
  },
  ACCOUNT_DELETED_CONFIRMATION: {
    url: "/account-deleted-confirmation",
    event: EventType.Confirmation,
    type: UserJourney.DeleteAccount,
  },
  AUTH_CALLBACK: { url: "/auth/callback" },
  SESSION_EXPIRED: { url: "/session-expired" },
  USER_SIGNED_OUT: { url: "/signed-out" },
  SIGN_OUT: { url: "/sign-out" },
  START: { url: "/" },
  HEALTHCHECK: { url: "/healthcheck" },
  GLOBAL_LOGOUT: { url: "/global-logout" },
  RESEND_EMAIL_CODE: { url: "/resend-email-code" },
  RESEND_PHONE_CODE: { url: "/resend-phone-code" },
  SECURITY_TXT: {
    url: "/.well-known/security.txt",
  },
  THANKS_TXT: {
    url: "/.well-known/thanks.txt",
  },
  TRACK_AND_REDIRECT: {
    url: "/track-and-redirect",
  },
};

export const MFA_METHODS = {
  SMS: {
    type: "sms",
    path: PATH_DATA.ADD_MFA_METHOD_SMS,
    event: EventType.SelectedSms,
  },
  APP: {
    type: "app",
    path: PATH_DATA.ADD_MFA_METHOD_APP,
    event: EventType.SelectedApp,
  },
};

export const WELL_KNOWN_FILES = {
  SECURITY_TEXT_URL:
    "https://vdp.cabinetoffice.gov.uk/.well-known/security.txt",
  THANKS_TEXT_URL: "https://vdp.cabinetoffice.gov.uk/thanks.txt",
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

export const METHOD_MANAGEMENT_API = {
  MFA_RETRIEVE: "/v1/mfa-methods/retrieve",
  MFA_METHODS_ADD: "/v1/mfa-methods",
  MFA_METHODS_PUT: "/v1/mfa-methods/%s",
  MFA_METHODS_DELETE: "/v1/mfa-methods/%s",
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

export interface LanguageCodes {
  en: "en-GB";
  cy: "cy-CY";
}

export const LANGUAGE_CODES: LanguageCodes = {
  en: "en-GB",
  cy: "cy-CY",
};

export const LOG_MESSAGES = {
  GS_COOKIE_NOT_IN_REQUEST: "gs cookie not in request.",
  DI_PERSISTENT_SESSION_ID_COOKIE_NOT_IN_REQUEST:
    "di-persistent-session-id cookie not in request.",
  MALFORMED_GS_COOKIE: (details: string): string =>
    `Malformed gs cookie contained: ${details}`,
  EVENT_SENT_SUCCESSFULLY: (queue: string, messageId: string): string =>
    `Event sent to ${queue} with message id ${messageId}`,
  ILLEGAL_ATTEMPT_TO_ACCESS_RSA:
    "An attempt to access RSA without having visited one of the allowed services was made.",
  ILLEGAL_ATTEMPT_TO_ACCESS_ACTIVITY_LOG:
    "An attempt to access the activity log without having visited one of the allowed services was made.",
};

export const ERROR_MESSAGES = {
  FAILED_TO_DESTROY_SESSION: (details: string): string =>
    `Failed to destroy session: ${details}`,
  QUEUE_URL_MISSING: "Environment missing queue url variable.",
  MESSAGE_COULD_NOT_BE_REDACTED: (details: string): string =>
    `Error: ${details} - message could not be redacted.`,
  REDACTED_EVENT: (details: string): string => `Redacted event: ${details}`,
  FAILED_TO_SEND_TO_TXMA: "Failed to send to TxMA",
  FAILED_SEND_TO_TXMA_DLQ: "Failed to send to TxMA DLQ.",
  FAILED_MFA_RETRIEVE_CALL: "Failed to call mfa methods API",
};

export const ERROR_CODES = {
  NEW_PASSWORD_SAME_AS_EXISTING: 1024,
  PASSWORD_IS_COMMON: 1040,
  NEW_PHONE_NUMBER_SAME_AS_EXISTING: 1044,
};

export const ENVIRONMENT_NAME = {
  PROD: "production",
  DEV: "development",
  TEST: "test",
};

export const EVENT_NAME = {
  HOME_TRIAGE_PAGE_VISIT: "HOME_TRIAGE_PAGE_VISIT",
  HOME_TRIAGE_PAGE_EMAIL: "HOME_TRIAGE_PAGE_EMAIL",
};

export interface QueryParameters {
  fromURL?: string;
  appSessionId?: string;
  appErrorCode?: string;
  theme?: string;
}

export const MISSING_APP_SESSION_ID_SPECIAL_CASE = "No app session ID";
export const MISSING_SESSION_ID_SPECIAL_CASE = "No session ID";
export const MISSING_PERSISTENT_SESSION_ID_SPECIAL_CASE =
  "No persistent session ID";
export const MISSING_USER_ID_SPECIAL_CASE = "No user ID";

export type ParamName = keyof QueryParameters;

export const OIDC_ERRORS = {
  ACCESS_DENIED: "access_denied",
};

export const SESSION_ID_UNKNOWN = "session-id-unknown";
export const CLIENT_SESSION_ID_UNKNOWN = "client-session-id-unknown";
export const PERSISTENT_SESSION_ID_UNKNOWN = "persistent-session-id-unknown";
