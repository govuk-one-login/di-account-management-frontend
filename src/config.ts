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
  //  Env var LOCALSTACK_HOSTNAME used by docker-compose.yml because host mode does not work in Docker for Mac
  //  and thus it uses host.docker.internal as the hostname to get to localstack.
  //  Github actions does not support host.docker.internal and therefore uses localhost hostname to get to localstack.
  const host =
    "LOCALSTACK_HOSTNAME" in process.env &&
    process.env.LOCALSTACK_HOSTNAME.trim().length > 0
      ? process.env.LOCALSTACK_HOSTNAME.trim()
      : "localhost";
  return `http://${host}:4566`;
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

export function getGtmId(): string {
  return process.env.GTM_ID;
}

export function getSessionExpiry(): number {
  return Number(process.env.SESSION_EXPIRY);
}

export function getSessionSecret(): string {
  return process.env.SESSION_SECRET;
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

export function getSessionStoreTableName(): string {
  return process.env.SESSION_STORE_TABLE_NAME;
}

export function supportLanguageCY(): boolean {
  return process.env.SUPPORT_LANGUAGE_CY === "1";
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
  "CEr97IZfEPQFgBxq8QNcM8LFxw4",
  "TGygWFxGDNn8ItyaecWCopqIX3s",
  "pDqO7_Hu-pq5wam5I4MlURXrv5k",
  "gov-uk",
  "lite",
  "ofqual",
  "modernSlavery",
];

export const getAllowedServiceListClientIDs: string[] = [
  "RqFZ83csmS4Mi4Y7s7ohD9-ekwU",
  "XwwVDyl5oJKtK0DVsuw3sICWkPU",
  "Dw7Cxas8W7O2usHMHok95elKDRU",
  "oLciSn5b6-cqcJjzgMMwCw1moD8",
  "LUIZbIuJ_xVZxwhkNAApcO4O_6o",
  "VsAkrtMBzAosSveAv4xsuUDyiSs",
  "socialWorkEngland",
  "dbs",
  "vehicleOperatorLicense",
  "mortgageDeed",
];

function getProtocol(): string {
  return getAppEnv() !== "local" ? "https://" : "http://";
}

export const activityLogItemsPerPage = 10;

export function supportActivityLog(): boolean {
  return process.env.SUPPORT_ACTIVITY_LOG === "1";
}
