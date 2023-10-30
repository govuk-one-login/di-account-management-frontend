import { UserJourney } from "./utils/state-machine";

export const PATH_DATA: {
  [key: string]: { url: string; event?: string; type?: UserJourney };
} = {
  CONTACT: { url: "/contact-gov-uk-one-login" },
  SIGN_IN_HISTORY: { url: "/security/sign-in-history" },
  MANAGE_YOUR_ACCOUNT: { url: "/manage-your-account" },
  SETTINGS: { url: "/settings" },
  SECURITY: { url: "/security" },
  YOUR_SERVICES: { url: "/your-services" },
  ENTER_PASSWORD: { url: "/enter-password" },
  WEBCHAT_DEMO: { url: "/webchat-demo" },
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
  INVALID_URL: "Invalid URL",
};

export const ERROR_CODES = {
  NEW_PASSWORD_SAME_AS_EXISTING: 1024,
  PASSWORD_IS_COMMON: 1040,
  NEW_PHONE_NUMBER_SAME_AS_EXISTING: 1044,
};

export const ENVIRONMENT_NAME = {
  PROD: "production",
  DEV: "development",
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

export type ParamName = keyof QueryParameters;
