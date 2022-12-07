export function getLogLevel(): string {
  return process.env.LOGS_LEVEL || "debug";
}

export function getApiBaseUrl(): string {
  return process.env.AM_API_BASE_URL;
}

export function getOIDCApiDiscoveryUrl(): string {
  return process.env.API_BASE_URL;
}

export function getLocalStackBaseUrl(): string {
  return "http://host.docker.internal:4566";
}

export function getOIDCClientId(): string {
  return process.env.OIDC_CLIENT_ID;
}

export function getOIDCClientScopes(): string {
  return process.env.OIDC_CLIENT_SCOPES;
}

export function getNodeEnv(): string {
  return process.env.NODE_ENV || "development";
}

export function getAppEnv(): string {
  return process.env.APP_ENV || "local";
}

export function isLocal(): boolean {
  return getAppEnv() == "local";
}

export function getGtmId(): string {
  return process.env.GTM_ID;
}

export function getSessionExpiry(): number {
  return Number(process.env.SESSION_EXPIRY);
}

export function getSessionSecret(): string {
  return process.env.SESSION_SECRET;
}

export function getSessionAccessKey(): string {
  return process.env.SESSION_ACCESS_KEY_ID;
}

export function getSessionSecretAccessKey(): string {
  return process.env.SESSION_SECRET_ACCESS_KEY;
}

export function getYourAccountUrl(): string {
  return process.env.AM_YOUR_ACCOUNT_URL;
}

export function getGovPublishingBaseAPIUrl(): string {
  return process.env.GOV_ACCOUNTS_PUBLISHING_API_URL;
}

export function getGovPublishingBaseAPIToken(): string {
  return process.env.GOV_ACCOUNTS_PUBLISHING_API_TOKEN;
}

export function getSessionTableName(): string {
  return process.env.SESSION_TABLE_NAME;
}

export function getAuthFrontEndUrl(): string {
  return getProtocol() + process.env.AUTH_FRONTEND_URL;
}

export function getAnalyticsCookieDomain(): string {
  return process.env.ANALYTICS_COOKIE_DOMAIN ?? "localhost";
}

export function getBaseUrl(): string {
  const baseUrl = process.env.BASE_URL ?? "localhost:6000";
  return getProtocol() + baseUrl;
}

export function getAwsRegion(): string {
  return "eu-west-2";
}

export function getKmsKeyId(): string {
  return process.env.KMS_KEY_ID;
}

export function getSNSDeleteTopic(): string {
  return process.env.DELETE_TOPIC_ARN;
}

export function getDynamoServiceStoreTableName(): string {
  return process.env.SERVICE_STORE_TABLE_NAME;
}

export function supportInternationalNumbers(): boolean {
  return process.env.SUPPORT_INTERNATIONAL_NUMBERS === "1";
}

export function supportLanguageCY(): boolean {
  return process.env.SUPPORT_LANGUAGE_CY === "1";
}

export function supportNewAccountHeader(): boolean {
  return process.env.SUPPORT_NEW_ACCOUNT_HEADER === "1";
}

export function supportDeleteServiceStore(): boolean {
  return process.env.SUPPORT_DELETE_SERVICE_STORE === "1";
}

export function supportServiceCards(): boolean {
  return process.env.SUPPORT_SERVICE_CARDS === "1";
}

export function getLogoutTokenMaxAge(): number {
  return Number(process.env.LOGOUT_TOKEN_MAX_AGE_SECONDS) || 120;
}

export function getTokenValidationClockSkew(): number {
  return Number(process.env.TOKEN_CLOCK_SKEW) || 10;
}

export function getManageGovukEmailsUrl(): string {
  return "https://www.gov.uk/email/manage";
}

export function getServiceDomain(): string {
  return process.env.SERVICE_DOMAIN ?? "";
}

export const getAllowedAccountListClientIDs: string[] = [
  "LcueBVCnGZw-YFdTZ4S07XbQx7I",
  "ZL0kvRBP5xMy5OwONj8ARLPyuko",
  "JO3ET6EtFN3FzjGC3yRP2qpuoHQ",
  "gov-uk",
  "lite",
];

export const getAllowedServiceListClientIDs: string[] = [
  "RqFZ83csmS4Mi4Y7s7ohD9-ekwU",
  "XwwVDyl5oJKtK0DVsuw3sICWkPU",
  "Dw7Cxas8W7O2usHMHok95elKDRU",
  "oLciSn5b6-cqcJjzgMMwCw1moD8",
  "dbs",
  "vehicleOperatorLicense",
];

function getProtocol(): string {
  return getAppEnv() !== "local" ? "https://" : "http://";
}
