export const PATH_NAMES = {
  MANAGE_YOUR_ACCOUNT: "/manage-your-account",
  ENTER_PASSWORD: "/enter-password",
  ENTER_NEW_EMAIL: "/enter-new-email",
  EMAIL_UPDATED_CONFIRMATION: "/email-updated-confirmation",
  ACCESSIBILITY_STATEMENT: "undefined",
  PRIVACY_POLICY: "undefined",
  TERMS_AND_CONDITIONS: "undefined",
  AUTH_CALLBACK: "/auth/callback",
};

export const API_ENDPOINTS = {
  CHECK_USER_PASSWORD: "/check-user-password",
  UPDATE_EMAIL: "/update-email",
};

export const HTTP_STATUS_CODES = {
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  OK: 200,
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

export const ENVIRONMENT_NAME = {
  PROD: "production",
  DEV: "development",
};
