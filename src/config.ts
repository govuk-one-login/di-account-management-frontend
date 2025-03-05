import { filterClients } from "di-account-management-client-registry";
import { ENVIRONMENT_NAME } from "./app.constants";

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

export function supportClientRegistryLibrary(): boolean {
  return process.env.SUPPORT_CLIENT_REGISTRY_LIBRARY === "1";
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

const GOV_UK_EMAIL_PROD = "LcueBVCnGZw-YFdTZ4S07XbQx7I";
const GOV_UK_EMAIL_NON_PROD = "CEr97IZfEPQFgBxq8QNcM8LFxw4";
const LITE_PROD = "ZL0kvRBP5xMy5OwONj8ARLPyuko";
const LITE_NON_PROD = "JO3ET6EtFN3FzjGC3yRP2qpuoHQ";
const OFQUAL_PROD = "TGygWFxGDNn8ItyaecWCopqIX3s";
const MODERN_SLAVERY_PROD = "pDqO7_Hu-pq5wam5I4MlURXrv5k";
const DBS_PROD = "Dw7Cxas8W7O2usHMHok95elKDRU";
const DBS_NON_PROD = "dbs";
const DBS_CHECK_PROD = "RqFZ83csmS4Mi4Y7s7ohD9-ekwU";
const MANAGE_APPRENTICESHIPS_PROD = "x3F_Iu0LgqJpegY5ni0QSB0uezw";
const CRIMINAL_INJURIES_COMPENSATION_PROD = "bGAwNKM0XvnxCAuDQ_rMhhP3dxM";
const AAS_PROD = "dVrdJ7aemrvR0YlX7lDRaXnz0mE";
const AAS_NON_PROD = "aas";
const APAR_PROD = "2nAxHa72OqhE6eKymHZIx-sV3vI";
const APAR_NON_PROD = "apar";
const VETERANS_CARD_PROD = "zFeCxrwpLCUHFm-C4_CztwWtLfQ";
const VETERANS_CARD_NON_PROD = "veteransCard";
const FIND_AND_APPLY_FOR_A_GRANT_PROD = "tya4DoMpw_B7FK5YvuMAj3asc0A";
const FIND_AND_APPLY_FOR_A_GRANT_NON_PROD = "findAndApplyForAGrant";
const FIND_UK_MARKET_CONFORMITY_ASSESMENT_PROD = "9fduJ6KAE8WwCb1VCKp788BC8mM";
const FIND_UK_MARKET_CONFORMITY_ASSESMENT_NON_PROD =
  "KiYrXyFTTy0JFZyYJI22WuxPIf8";
const DVSA_PROD = "oLciSn5b6-cqcJjzgMMwCw1moD8";
const DVSA_NON_PROD = "vehicleOperatorLicense";
const STUB_RP_PROD = "5Vfplamzln0AoarlnX5CX4UTqyh59xfA";
const STUB_RP_INTEGRATION = "gjWNvoLYietMjeaOE6Zoww533u18ZUfr";
const STUB_RP_STAGING = "3NKFv679oYlMdyrhKErrTGbzBy2h8rrd";
const CONNECT_FAMILIES_TO_SUPPORT_PROD = "cqGoT1LYLsjn-iwGcDTzamckhZU";
export const ONE_LOGIN_HOME_NON_PROD = "oneLoginHome";
const DWP_INTEGRATION = "RtE7mP5yzCrdthst1kuVHS1SsSw";
const DWP_PROD = "kvGpTatgWm3YqXHbG41eOdDf91k";
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
const HMPO_CANCEL_PASSPORT = "l6GFmD8ndn7afVcm6SqAHlM8IVM";
const HMPO_CANCEL_PASSPORT_NON_PROD = "hmpoCancelPassport";
const DEFRA_DANGEROUS_DOGS_INDEX = "u6cETcTbDeT5PZaRRvUskHQeZq8";
const DEFRA_DANGEROUS_DOGS_INDEX_NON_PROD = "defraDangerousDogsIndex";
const DBT_APPLY_FOR_AN_IMPORT = "gSKx5snZtYsQWSQZRoKI2oV-7lQ";
const DBT_APPLY_FOR_AN_IMPORT_NON_PROD = "dbtApplyForAnImportLicense";
const CMAD_PROD = "Q2tqV5C1nGXFVMUcnpqbOUTrZuw";
const CMAD_NON_PROD = "CMAD";
const DFE_TEACHER_VACANCIES_PROD = "CVZjwDf4DJROtdPH2vStPXUALrM";
const DFE_TEACHER_VACANCIES_NON_PROD = "dfeTeacherVacancies";
const OFGEM_LAF_REG_PROD = "eywumu-XiJCz7RHyw4Zv8iTgsuc";
const OFGEM_LAF_REG_NON_PROD = "ofgemLafReg";
const MANAGE_FAMILY_SUPPORT_SERVICES_AND_ACCOUNTS_PROD =
  "zbNToJPcre4BXEap0na8kOjniKg";
const GREAT_BRITISH_INSULATION_SCHEME_PROD = "FakIq5aYsHQ02dBOc6XwyA1wRRs";
const EARLY_YEARS_CHILD_DEV_TRAINING_PROD = "txsGLvMYYCPaWPZRq2L7XxEnyro";
const FIND_API_DFE_PROD = "9uEx86ZHEp8ycgdHNqC8VK87E1A";
const PLAN_YOUR_FUTURE_MOJ_PROD = "DVUDWXsy0io7wDBH5LA5IEkEH5U";
const WELSH_FISHERIES_PERMIT_PROD = "tPCCSyoMaFNbLTt0gEW609h15Uc";
const REGISTER_OF_IMMIGRATION_ADVISORS_PROD =
  "Gk-D7WMvytB44Nze7oEC5KcThQZ4yl7sAA";
const HMRC_NON_PROD = "mQDXGO7gWdK7V28v82nVcEGuacY";
const VEHICLE_OPERATOR_LICENSE_PROD = "XwwVDyl5oJKtK0DVsuw3sICWkPU";
const APPLY_REGISTERED_SOCIAL_WORKER_ENGLAND_PROD =
  "LUIZbIuJ_xVZxwhkNAApcO4O_6o";
const SIGN_MORTGAGE_DEED_PROD = "VsAkrtMBzAosSveAv4xsuUDyiSs";
const DFE_QUALIFIED_TEACHER_STATUS_PROD = "GQzNgSkj3QpmHlPO1kIfbMW1PAw";
const DFE_QUALIFIED_TEACHER_STATUS_NON_PROD = "dfeQualifiedTeacherStatus";
const CHECK_FAMILY_ELIGIBILITY_PROD = "CKHfr_Kz84LYFnsP7m6YJBXqBzw";
const CHECK_FAMILY_ELIGIBILITY_NON_PROD = "checkFamilyEligibility";
const FIND_A_TENDER_PROD = "L8SSq5Iz8DstkBgno0Hx5aujelE";
const FIND_A_TENDER_NON_PROD = "findATender";
const AIR_POLLUTION_ASSESMENT_ARCHIVE_PROD = "glcH6E9VxtnCAPPwBt550zDh22Q";
const AIR_POLLUTION_ASSESMENT_ARCHIVE_NON_PROD = "airPollutionAssesment";
const HOME_OFFICE_SEAS_PROD = "PVTFrS4kgHYHFDqEb5IFanlIfcM";
const HOME_OFFICE_SEAS_NON_PROD = "homeOfficeSEAS";
const DFE_APPLY_FOR_TEACHER_TRAINING_PROD = "wo1OYi8Z2fCQEX-9B8IPS2-F-ZE";
const DFE_APPLY_FOR_TEACHER_TRAINING_NON_PROD = "dfeApplyForTeacherTraining";
const DB_TRADE_PROD = "dPIP320ek5A50_12a00U2sEoM0k";
const DB_TRADE_NON_PROD = "dbTrade";
const INTELLECTUAL_PROPERTY_OFFICE_PROD = "Mh3SUEDHB74A2SIB_1VAXZKG_iw";
const INTELLECTUAL_PROPERTY_OFFICE_NON_PROD = "intellectualPropertyOffice";
const HEAT_NETWORK_ZONING_PROD = "_cv8flGYkTpGUgCQN7Oab8wV15w";
const HEAT_NETWORK_ZONING_NON_PROD = "heatNetworkZoning";
const RURAL_PAYMENT_WALES_PROD = "SdpFRM0HdX38FfdbgRX8qzTl8sm";
const RURAL_PAYMENT_WALES_NON_PROD = "ruralPaymentWales";

const allowedAccountListClientIDs: string[] = [
  GOV_UK_EMAIL_PROD,
  LITE_PROD,
  LITE_NON_PROD,
  GOV_UK_EMAIL_NON_PROD,
  OFQUAL_PROD,
  MODERN_SLAVERY_PROD,
  MANAGE_APPRENTICESHIPS_PROD,
  FIND_AND_APPLY_FOR_A_GRANT_PROD,
  FIND_AND_APPLY_FOR_A_GRANT_NON_PROD,
  CRIMINAL_INJURIES_COMPENSATION_PROD,
  "gov-uk",
  "lite",
  "ofqual",
  "modernSlavery",
  "apprenticeshipsService",
  "criminalInjuriesCompensation",
  FIND_UK_MARKET_CONFORMITY_ASSESMENT_PROD,
  FIND_UK_MARKET_CONFORMITY_ASSESMENT_NON_PROD,
  "ukmcab",
  CONNECT_FAMILIES_TO_SUPPORT_PROD,
  "manageFamilySupport",
  MANAGE_FAMILY_SUPPORT_SERVICES_AND_ACCOUNTS_PROD,
  "connectFamilies",
  APAR_PROD,
  APAR_NON_PROD,
  AAS_PROD,
  AAS_NON_PROD,
  GREAT_BRITISH_INSULATION_SCHEME_PROD,
  "gbis",
  EARLY_YEARS_CHILD_DEV_TRAINING_PROD,
  "childDevelopmentTraining",
  DWP_INTEGRATION,
  DWP_PROD,
  DWP_NON_PROD,
  FIND_API_DFE_PROD,
  "dfeFindAndUseAnApi",
  PLAN_YOUR_FUTURE_MOJ_PROD,
  "mojPlanYourFuture",
  WELSH_FISHERIES_PERMIT_PROD,
  "welshFisheriesPermit",
  REGISTER_OF_IMMIGRATION_ADVISORS_PROD,
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
  HMPO_CANCEL_PASSPORT,
  HMPO_CANCEL_PASSPORT_NON_PROD,
  DEFRA_DANGEROUS_DOGS_INDEX,
  DEFRA_DANGEROUS_DOGS_INDEX_NON_PROD,
  DBT_APPLY_FOR_AN_IMPORT,
  DBT_APPLY_FOR_AN_IMPORT_NON_PROD,
  CMAD_PROD,
  CMAD_NON_PROD,
  DFE_TEACHER_VACANCIES_PROD,
  DFE_TEACHER_VACANCIES_NON_PROD,
  OFGEM_LAF_REG_PROD,
  OFGEM_LAF_REG_NON_PROD,
  DFE_QUALIFIED_TEACHER_STATUS_PROD,
  DFE_QUALIFIED_TEACHER_STATUS_NON_PROD,
  FIND_A_TENDER_PROD,
  FIND_A_TENDER_NON_PROD,
  AIR_POLLUTION_ASSESMENT_ARCHIVE_NON_PROD,
  AIR_POLLUTION_ASSESMENT_ARCHIVE_PROD,
  HOME_OFFICE_SEAS_NON_PROD,
  HOME_OFFICE_SEAS_PROD,
  DFE_APPLY_FOR_TEACHER_TRAINING_PROD,
  DFE_APPLY_FOR_TEACHER_TRAINING_NON_PROD,
  DB_TRADE_PROD,
  DB_TRADE_NON_PROD,
  INTELLECTUAL_PROPERTY_OFFICE_PROD,
  INTELLECTUAL_PROPERTY_OFFICE_NON_PROD,
  HEAT_NETWORK_ZONING_PROD,
  HEAT_NETWORK_ZONING_NON_PROD,
  RURAL_PAYMENT_WALES_PROD,
  RURAL_PAYMENT_WALES_NON_PROD,
];

function getIdListFromFilter(
  filter: Parameters<typeof filterClients>[1]
): string[] {
  return filterClients(getAppEnv(), filter).map((client) => client.clientId);
}

export const getAllowedAccountListClientIDs = supportClientRegistryLibrary()
  ? getIdListFromFilter({ clientType: "account" })
  : allowedAccountListClientIDs;

export const hmrcClientIds: string[] = supportClientRegistryLibrary()
  ? getIdListFromFilter({ isHmrc: true })
  : [HMRC_NON_PROD, "hmrc"];

export const rsaAllowList: string[] = supportClientRegistryLibrary()
  ? getIdListFromFilter({ isReportSuspiciousActivityEnabled: true })
  : [...hmrcClientIds, STUB_RP_INTEGRATION, STUB_RP_PROD, STUB_RP_STAGING];

const allowedServiceListClientIDs: string[] = [
  DBS_CHECK_PROD,
  VEHICLE_OPERATOR_LICENSE_PROD,
  DBS_PROD,
  DVSA_PROD,
  APPLY_REGISTERED_SOCIAL_WORKER_ENGLAND_PROD,
  SIGN_MORTGAGE_DEED_PROD,
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
  CHECK_FAMILY_ELIGIBILITY_PROD,
  CHECK_FAMILY_ELIGIBILITY_NON_PROD,
];

export const getAllowedServiceListClientIDs = supportClientRegistryLibrary()
  ? getIdListFromFilter({ clientType: "service" })
  : allowedServiceListClientIDs;

const clientsToShowInSearchNonProd: string[] = [
  "gov-uk",
  "lite",
  "ofqual",
  "modernSlavery",
  "apprenticeshipsService",
  "criminalInjuriesCompensation",
  "ukmcab",
  "manageFamilySupport",
  "connectFamilies",
  "gbis",
  "childDevelopmentTraining",
  "dfeFindAndUseAnApi",
  "mojPlanYourFuture",
  "welshFisheriesPermit",
  "iaa",
];

const clientsToShowInSearchProd: string[] = [
  GOV_UK_EMAIL_PROD,
  OFQUAL_PROD,
  MODERN_SLAVERY_PROD,
  DBS_CHECK_PROD,
  VEHICLE_OPERATOR_LICENSE_PROD,
  APPLY_REGISTERED_SOCIAL_WORKER_ENGLAND_PROD,
  SIGN_MORTGAGE_DEED_PROD,
  MANAGE_APPRENTICESHIPS_PROD,
  FIND_AND_APPLY_FOR_A_GRANT_PROD,
  FIND_UK_MARKET_CONFORMITY_ASSESMENT_PROD,
  MANAGE_FAMILY_SUPPORT_SERVICES_AND_ACCOUNTS_PROD,
  CONNECT_FAMILIES_TO_SUPPORT_PROD,
  VETERANS_CARD_PROD,
  EARLY_YEARS_CHILD_DEV_TRAINING_PROD,
  DWP_PROD,
  FIND_API_DFE_PROD,
  WELSH_FISHERIES_PERMIT_PROD,
  REGISTER_OF_IMMIGRATION_ADVISORS_PROD,
  USE_LASTING_POWER_OF_ATTORNEY_PROD,
  DBT_APPLY_EXPORT_CERT,
  HMPO_CANCEL_PASSPORT,
  DBT_APPLY_FOR_AN_IMPORT,
  AAS_PROD,
  APAR_PROD,
  DRIVING_MEDICAL_CONDITION_PROD,
  CRIMINAL_INJURIES_COMPENSATION_PROD,
  FAA_PROD,
  DFE_TEACHER_VACANCIES_PROD,
  CMAD_PROD,
  AIR_POLLUTION_ASSESMENT_ARCHIVE_PROD,
];

export const getClientsToShowInSearch = (): string[] => {
  if (supportClientRegistryLibrary()) {
    return getIdListFromFilter({ showInClientSearch: true });
  }
  return getAppEnv() === ENVIRONMENT_NAME.PROD
    ? clientsToShowInSearchProd
    : clientsToShowInSearchNonProd;
};

function getProtocol(): string {
  return getAppEnv() !== "local" ? "https://" : "http://";
}

export const activityLogItemsPerPage = 10;

export function supportActivityLog(): boolean {
  return process.env.SUPPORT_ACTIVITY_LOG === "1";
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

export function supportMfaPage(): boolean {
  return process.env.SUPPORT_METHOD_MANAGEMENT === "1";
}

export function googleAnalytics4GtmContainerId(): string {
  return process.env.GOOGLE_ANALYTICS_4_GTM_CONTAINER_ID;
}

export function universalAnalyticsGtmContainerId(): string {
  return process.env.UNIVERSAL_ANALYTICS_GTM_CONTAINER_ID;
}

export function googleAnalytics4Enabled(): boolean {
  return process.env.GA4_ENABLED === "true";
}

export function missionLabsWebSocketAddress(): string {
  return process.env.MISSION_LAB_WEBSOCKET_ADDR;
}

export function universalAnalyticsEnabled(): boolean {
  return process.env.UA_ENABLED === "true";
}

export function selectContentTrackingEnabled(): boolean {
  return process.env.SELECT_TRACKING_ENABLED === "true";
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

export function supportSearchableList(): boolean {
  return process.env.SUPPORT_SEARCHABLE_LIST === "1";
}

export function getDtRumUrl(): string {
  return process.env.DT_RUM_URL;
}
