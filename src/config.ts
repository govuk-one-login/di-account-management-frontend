import { filterClients } from "di-account-management-rp-registry";
import { ENVIRONMENT_NAME, LOCALE } from "./app.constants";
import { createTimedMemoize } from "./utils/createTimedMemoize";

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

export function getAppEnv(): string {
  return process.env.APP_ENV || ENVIRONMENT_NAME.LOCAL;
}

export function isLocalEnv(): boolean {
  return getAppEnv() === ENVIRONMENT_NAME.LOCAL;
}

export function isProd(): boolean {
  return getAppEnv() === ENVIRONMENT_NAME.PROD;
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

export function getFingerprintCookieDomain(): string {
  return process.env.FINGERPRINT_COOKIE_DOMAIN ?? "localhost";
}

export function getBaseUrl(): string {
  const baseUrl = process.env.BASE_URL ?? "localhost:6000";
  return getProtocol() + baseUrl;
}

export function getAwsRegion(): string {
  return process.env.AWS_REGION ?? "eu-west-2";
}

export function getKmsKeyId(): string {
  return process.env.KMS_KEY_ID;
}

export function getSNSDeleteTopic(): string {
  return process.env.DELETE_TOPIC_ARN;
}

export function getSNSSuspicousActivityTopic(): string {
  return process.env.SUSPICIOUS_ACTIVITY_TOPIC_ARN;
}

export function getDynamoServiceStoreTableName(): string {
  return process.env.SERVICE_STORE_TABLE_NAME;
}

export function getSessionStoreTableName(): string {
  return process.env.SESSION_STORE_TABLE_NAME;
}

export function getLogoutTokenMaxAge(): number {
  return Number(process.env.LOGOUT_TOKEN_MAX_AGE_SECONDS) || 120;
}

export function getTokenValidationClockSkew(): number {
  return Number(process.env.TOKEN_CLOCK_SKEW) || 10;
}

export function getServiceDomain(): string {
  return process.env.SERVICE_DOMAIN ?? "";
}

export function getAccessibilityStatementUrl(): string {
  return process.env.ACCESSIBILITY_STATEMENT_URL;
}

export const ONE_LOGIN_HOME_NON_PROD = "oneLoginHome";

export const getIdListFromFilter = createTimedMemoize(
  (filter: Parameters<typeof filterClients>[1]): string[] => {
    return filterClients(getAppEnv(), filter).map((client) => client.clientId);
  },
  5 * 60 * 1000 // Cache for 5 minutes (in milliseconds)
);

export const getListOfActivityHistoryClientIDs = getIdListFromFilter({
  showInActivityHistory: true,
});

export const getListOfAccountClientIDs = getIdListFromFilter({
  showInAccounts: true,
  isOffboarded: false,
});

export const getClientsWithDetailedCard = getIdListFromFilter({
  showDetailedCard: true,
});

export const getListOfServiceClientIDs = getIdListFromFilter({
  showInServices: true,
  isOffboarded: false,
});

export const getListOfClientIDsAvailableInWelsh = getIdListFromFilter({
  isAvailableInWelsh: true,
});

export const getListOfShowInDeleteAccountClientIDs = getIdListFromFilter({
  showInDeleteAccount: true,
});

export const getClientsToShowInSearch = (language: LOCALE) => {
  if (language === LOCALE.CY) {
    return getIdListFromFilter({
      showInSearchableList: true,
      isAvailableInWelsh: true,
    });
  }
  return getIdListFromFilter({ showInSearchableList: true });
};

function getProtocol(): string {
  return getAppEnv() !== "local" ? "https://" : "http://";
}

export const activityLogItemsPerPage = 10;

export function reportSuspiciousActivity(): boolean {
  return process.env.REPORT_SUSPICIOUS_ACTIVITY === "1";
}

export function getDynamoActivityLogStoreTableName(): string {
  return process.env.ACTIVITY_LOG_STORE_TABLE_NAME;
}

export function getWebchatUrl(): string {
  return process.env.WEBCHAT_SOURCE_URL;
}

export function supportWebchatContact(): boolean {
  return process.env.SUPPORT_WEBCHAT_CONTACT === "1";
}

export function supportPhoneContact(): boolean {
  return process.env.SUPPORT_PHONE_CONTACT === "1";
}

export function showContactEmergencyMessage(): boolean {
  return process.env.SHOW_CONTACT_EMERGENCY_MESSAGE === "1";
}

export function getContactEmailServiceUrl(): string {
  return process.env.CONTACT_EMAIL_SERVICE_URL;
}

export function googleAnalytics4GtmContainerId(): string {
  return process.env.GOOGLE_ANALYTICS_4_GTM_CONTAINER_ID;
}

export function googleAnalytics4Enabled(): boolean {
  return process.env.GA4_ENABLED === "true";
}

export function missionLabsWebSocketAddress(): string {
  return process.env.MISSION_LAB_WEBSOCKET_ADDR;
}

export function selectContentTrackingEnabled(): boolean {
  return process.env.SELECT_TRACKING_ENABLED === "true";
}

export function getMfaServiceUrl(): string {
  return process.env.METHOD_MANAGEMENT_BASE_URL;
}

export function supportSearchableList(): boolean {
  return process.env.SUPPORT_SEARCHABLE_LIST === "1";
}

export function getDtRumUrl(): string {
  return process.env.DT_RUM_URL;
}

export function supportGlobalLogout(): boolean {
  return process.env.SUPPORT_GLOBAL_LOGOUT === "1";
}

export function supportIdTokenSignatureCheck(): boolean {
  return process.env.IDTOKEN_SIGNATURE_CHECK === "1";
}
