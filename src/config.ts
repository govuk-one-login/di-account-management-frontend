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

export function supportLanguageCY(): boolean {
  return process.env.SUPPORT_LANGUAGE_CY === "1";
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

const DBS_PROD = "Dw7Cxas8W7O2usHMHok95elKDRU";
const DBS_NON_PROD = "dbs";
const AAS_PROD = "dVrdJ7aemrvR0YlX7lDRaXnz0mE";
const AAS_NON_PROD = "aas";
const APAR_PROD = "2nAxHa72OqhE6eKymHZIx-sV3vI";
const APAR_NON_PROD = "apar";
const VETERANS_CARD_PROD = "zFeCxrwpLCUHFm-C4_CztwWtLfQ";
const VETERANS_CARD_NON_PROD = "veteransCard";
const FIND_AND_APPLY_FOR_A_GRANT_PROD = "tya4DoMpw_B7FK5YvuMAj3asc0A";
const FIND_AND_APPLY_FOR_A_GRANT_NON_PROD = "findAndApplyForAGrant";
const DVSA_PROD = "oLciSn5b6-cqcJjzgMMwCw1moD8";
const DVSA_NON_PROD = "vehicleOperatorLicense";
const STUB_RP_PROD = "5Vfplamzln0AoarlnX5CX4UTqyh59xfA";
const STUB_RP_INTEGRATION = "gjWNvoLYietMjeaOE6Zoww533u18ZUfr";
const STUB_RP_STAGING = "3NKFv679oYlMdyrhKErrTGbzBy2h8rrd";
export const ONE_LOGIN_HOME_NON_PROD = "oneLoginHome";
const DWP_INTEGRATION = "sqae3L7gOdizeRqFMw_KCDlhcyg";
const DWP_INTEGRATION_2 = "RtE7mP5yzCrdthst1kuVHS1SsSw";
const DWP_LOCAL_DEV_INTEGRATION = "iOf3hyG7eymusbSUS6LgFeQ7AtU";
const DWP_NON_PROD = "dwpBenefitOwed";
const PRISON_VISITS_PROD = "XbPzF-ccO0utCxlifxSyA4Ng0API2XTCQQ";
const PRISON_VISITS_NON_PROD = "prisonVisits";
const ATE_CAPITAL_PROD = "S1hl5G31dSsMYqPaOuiRVOLhBX0";
const ATE_CAPITAL_NON_PROD = "ate";
const FAA_PROD = "CCdLjqwGtpAA1Td2CrNHT1yFbqa";
const FAA_NON_PROD = "faa";
const DRIVING_MEDICAL_CONDITION_PROD = "iJNgycwBNEWGQvkuiLxOdVmVzG9";
const DRIVING_MEDICAL_CONDITION_NON_PROD = "drivingMedicalCondition";
const USE_LASTING_POWER_OF_ATTORNEY_PROD = "DduaLZl49t9hHADHyzJBmEwvbsw";
const USE_LASTING_POWER_OF_ATTORNEY_NON_PROD = "useLastingPowerOfAttorney";
const PDP_CONNECT_PROD = "sdlgbEirK30fvgbrf0C78XY60qN";
const PDP_CONNECT_NON_PROD = "PDPConnect";
const DFE_CLAIM_ADDITIONAL_PAYMENTS = "IJ_TuVEgIqAWT2mCe9b5uocMyNs";
const DFE_CLAIM_ADDITIONAL_PAYMENTS_NON_PROD = "dfeClaimAdditionalPayments";
const COMPANY_HOUSE_ACCOUNTS_PROD = "Hp9xO0Wda9EcI_2IO8OGeYJyrT0";
const COMPANY_HOUSE_ACCOUNTS_INTEGRATION = "VdmfAXiINT9wpUsGO_vVnPEbsAE";
const COMPANY_HOUSE_ACCOUNTS_NON_PROD = "companyHouseAccounts";
const DBT_APPLY_EXPORT_CERT = "Xj93G5rMO2CsouiG8DJf36siQRk";
const DBT_APPLY_EXPORT_CERT_NON_PROD = "dbtApplyForAnExportCertificate";

export const getAllowedAccountListClientIDs: string[] = [
  "LcueBVCnGZw-YFdTZ4S07XbQx7I",
  "ZL0kvRBP5xMy5OwONj8ARLPyuko",
  "JO3ET6EtFN3FzjGC3yRP2qpuoHQ",
  "CEr97IZfEPQFgBxq8QNcM8LFxw4",
  "TGygWFxGDNn8ItyaecWCopqIX3s",
  "pDqO7_Hu-pq5wam5I4MlURXrv5k",
  "x3F_Iu0LgqJpegY5ni0QSB0uezw",
  FIND_AND_APPLY_FOR_A_GRANT_PROD,
  FIND_AND_APPLY_FOR_A_GRANT_NON_PROD,
  "bGAwNKM0XvnxCAuDQ_rMhhP3dxM",
  "gov-uk",
  "lite",
  "ofqual",
  "modernSlavery",
  "apprenticeshipsService",
  "criminalInjuriesCompensation",
  "9fduJ6KAE8WwCb1VCKp788BC8mM",
  "KiYrXyFTTy0JFZyYJI22WuxPIf8",
  "ukmcab",
  "cqGoT1LYLsjn-iwGcDTzamckhZU",
  "manageFamilySupport",
  "zbNToJPcre4BXEap0na8kOjniKg",
  "connectFamilies",
  APAR_PROD,
  APAR_NON_PROD,
  AAS_PROD,
  AAS_NON_PROD,
  "FakIq5aYsHQ02dBOc6XwyA1wRRs",
  "gbis",
  "txsGLvMYYCPaWPZRq2L7XxEnyro",
  "childDevelopmentTraining",
  DWP_INTEGRATION,
  DWP_INTEGRATION_2,
  DWP_LOCAL_DEV_INTEGRATION,
  DWP_NON_PROD,
  "9uEx86ZHEp8ycgdHNqC8VK87E1A",
  "dfeFindAndUseAnApi",
  "DVUDWXsy0io7wDBH5LA5IEkEH5U",
  "mojPlanYourFuture",
  "tPCCSyoMaFNbLTt0gEW609h15Uc",
  "welshFisheriesPermit",
  "Gk-D7WMvytB44Nze7oEC5KcThQZ4yl7sAA",
  "iaa",
  PRISON_VISITS_PROD,
  PRISON_VISITS_NON_PROD,
  ATE_CAPITAL_PROD,
  ATE_CAPITAL_NON_PROD,
  FAA_PROD,
  FAA_NON_PROD,
  USE_LASTING_POWER_OF_ATTORNEY_PROD,
  USE_LASTING_POWER_OF_ATTORNEY_NON_PROD,
  PDP_CONNECT_NON_PROD,
  PDP_CONNECT_PROD,
  COMPANY_HOUSE_ACCOUNTS_NON_PROD,
  COMPANY_HOUSE_ACCOUNTS_INTEGRATION,
  COMPANY_HOUSE_ACCOUNTS_PROD,
  DBT_APPLY_EXPORT_CERT,
  DBT_APPLY_EXPORT_CERT_NON_PROD,
];

export const hmrcClientIds: string[] = ["mQDXGO7gWdK7V28v82nVcEGuacY", "hmrc"];

export const rsaAllowList: string[] = [
  ...hmrcClientIds,
  STUB_RP_INTEGRATION,
  STUB_RP_PROD,
  STUB_RP_STAGING,
];

export const getAllowedServiceListClientIDs: string[] = [
  "RqFZ83csmS4Mi4Y7s7ohD9-ekwU",
  "XwwVDyl5oJKtK0DVsuw3sICWkPU",
  DBS_PROD,
  DVSA_PROD,
  "LUIZbIuJ_xVZxwhkNAApcO4O_6o",
  "VsAkrtMBzAosSveAv4xsuUDyiSs",
  "socialWorkEngland",
  DBS_NON_PROD,
  DVSA_NON_PROD,
  "mortgageDeed",
  VETERANS_CARD_PROD,
  VETERANS_CARD_NON_PROD,
  ...hmrcClientIds,
  DRIVING_MEDICAL_CONDITION_PROD,
  DRIVING_MEDICAL_CONDITION_NON_PROD,
  DFE_CLAIM_ADDITIONAL_PAYMENTS,
  DFE_CLAIM_ADDITIONAL_PAYMENTS_NON_PROD,
];

function getProtocol(): string {
  return getAppEnv() !== "local" ? "https://" : "http://";
}

export const activityLogItemsPerPage = 10;

export function supportActivityLog(): boolean {
  return process.env.SUPPORT_ACTIVITY_LOG === "1";
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

export function supportMfaPage(): boolean {
  return process.env.SUPPORT_METHOD_MANAGEMENT === "1";
}

export function googleAnalytics4GtmContainerId(): string {
  return process.env.GOOGLE_ANALYTICS_4_GTM_CONTAINER_ID;
}

export function universalAnalyticsGtmContainerId(): string {
  return process.env.UNIVERSAL_ANALYTICS_GTM_CONTAINER_ID;
}

export function googleAnalytics4Disabled(): string {
  return process.env.GA4_DISABLED || "true";
}

export function universalAnalyticsDisabled(): string {
  return process.env.UA_DISABLED || "false";
}

export function getMfaServiceUrl(): string {
  return process.env.METHOD_MANAGEMENT_BASE_URL;
}

export function supportChangeMfa(): boolean {
  return process.env.SUPPORT_CHANGE_MFA === "1";
}

export function supportAddBackupMfa(): boolean {
  return process.env.SUPPORT_ADD_BACKUP_MFA === "1";
}

export function getDtRumUrl(): string {
  return process.env.DT_RUM_URL;
}
