import { filterClients } from "di-account-management-rp-registry";
import memoize from "fast-memoize";
import { LOCALE } from "./app.constants";

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

export function isLocalEnv(): boolean {
  return getAppEnv() === "local";
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

export function getResultsPerServicePage(): number {
  return Number(process.env.RESULTS_PER_SERVICE_PAGE) || 1000;
}

const STUB_RP_PROD = "5Vfplamzln0AoarlnX5CX4UTqyh59xfA";
const STUB_RP_INTEGRATION = "gjWNvoLYietMjeaOE6Zoww533u18ZUfr";
const STUB_RP_STAGING = "3NKFv679oYlMdyrhKErrTGbzBy2h8rrd";
export const ONE_LOGIN_HOME_NON_PROD = "oneLoginHome";

export const getIdListFromFilter = memoize(
  (filter: Parameters<typeof filterClients>[1]): string[] => {
    return filterClients(getAppEnv(), filter).map((client) => client.clientId);
  }
);

export const getAllowedAccountListClientIDs = getIdListFromFilter({
  clientType: "account",
  isOffboarded: false,
});

export const hmrcClientIds: string[] = getIdListFromFilter({ isHmrc: true });

export const activityLogAllowList: string[] = [
  STUB_RP_INTEGRATION,
  STUB_RP_PROD,
  STUB_RP_STAGING,
  ...getIdListFromFilter({ isActivityLogEnabled: true }),
];

export const getAllowedServiceListClientIDs = getIdListFromFilter({
  clientType: "service",
  isOffboarded: false,
});

export const rsaAllowList = getIdListFromFilter({
  isReportSuspiciousActivityEnabled: true,
});

export const getClientsToShowInSearch = (language: LOCALE) => {
  if (language === LOCALE.CY) {
    return getIdListFromFilter({
      showInClientSearch: true,
      isAvailableInWelsh: true,
    });
  }
  return getIdListFromFilter({ showInClientSearch: true });
};

function getProtocol(): string {
  return getAppEnv() !== "local" ? "https://" : "http://";
}

export const activityLogItemsPerPage = 10;

export function supportActivityLog(): boolean {
  return process.env.SUPPORT_ACTIVITY_LOG === "1";
}

// reportSuspiciousActivity() turns the OLH-owned RSA journey on/off
// supportReportingForm() turns the link into the auth-owned RSA journey on/off
// reportSuspiciousActivity() and supportReportingForm() should never be on at the same time
export function supportReportingForm(): boolean {
  return (
    process.env.REPORT_SUSPICIOUS_ACTIVITY === "0" &&
    process.env.SUPPORT_REPORTING_FORM === "1"
  );
}

export function reportSuspiciousActivity(): boolean {
  return process.env.REPORT_SUSPICIOUS_ACTIVITY === "1";
}

export function getDynamoActivityLogStoreTableName(): string {
  return process.env.ACTIVITY_LOG_STORE_TABLE_NAME;
}

export function supportTriagePage(): boolean {
  return process.env.SUPPORT_TRIAGE_PAGE === "1";
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

export function showContactGuidance(): boolean {
  return process.env.SHOW_CONTACT_GUIDANCE === "1";
}

export function showContactEmergencyMessage(): boolean {
  return process.env.SHOW_CONTACT_EMERGENCY_MESSAGE === "1";
}

export function getContactEmailServiceUrl(): string {
  return process.env.CONTACT_EMAIL_SERVICE_URL;
}

export function supportMfaManagement(cookies: Record<string, string>): boolean {
  return (
    process.env.SUPPORT_METHOD_MANAGEMENT === "1" ||
    (process.env.SUPPORT_METHOD_MANAGEMENT === "qa" &&
      cookies.enable_mfa_for_qa === "1")
  );
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

export function supportChangeMfa(cookies: Record<string, string>): boolean {
  return (
    process.env.SUPPORT_CHANGE_MFA === "1" ||
    (process.env.SUPPORT_CHANGE_MFA === "qa" &&
      cookies.enable_mfa_for_qa === "1")
  );
}

export function supportAddBackupMfa(cookies: Record<string, string>): boolean {
  return (
    process.env.SUPPORT_ADD_BACKUP_MFA === "1" ||
    (process.env.SUPPORT_ADD_BACKUP_MFA === "qa" &&
      cookies.enable_mfa_for_qa === "1")
  );
}

export function supportSearchableList(): boolean {
  return process.env.SUPPORT_SEARCHABLE_LIST === "1";
}

export function getDtRumUrl(): string {
  return process.env.DT_RUM_URL;
}

export function supportDeviceIntelligence(): boolean {
  return process.env.DEVICE_INTELLIGENCE_TOGGLE === "1";
}

export function supportBrandRefresh(): boolean {
  return process.env.BRAND_REFRESH_ENABLED === "1";
}

export function supportChangeOnIntervention(): boolean {
  return process.env.ENABLE_CHANGE_ON_INTERVENTION === "1";
}
