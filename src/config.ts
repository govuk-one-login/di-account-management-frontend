import CF_CONFIG from "./config/cf";
import ssm from "./utils/ssm";
import { RedisConfig } from "./types";
import { Parameter } from "aws-sdk/clients/ssm";

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

export function getRedisHost(): string {
  return process.env.REDIS_HOST ?? "redis";
}

export function getRedisPort(): number {
  return Number(process.env.REDIS_PORT) ?? 6379;
}

export async function getRedisConfig(appEnv: string): Promise<RedisConfig> {
  const hostKey = `${appEnv}-${process.env.REDIS_KEY}-redis-master-host`;
  const portKey = `${appEnv}-${process.env.REDIS_KEY}-redis-port`;
  const passwordKey = `${appEnv}-${process.env.REDIS_KEY}-redis-password`;

  const params = {
    Names: [hostKey, portKey, passwordKey],
    WithDecryption: true,
  };

  const result = await ssm.getParameters(params).promise();

  if (result.InvalidParameters && result.InvalidParameters.length > 0) {
    throw Error("Invalid SSM config values for redis");
  }

  return {
    password: result.Parameters.find((p: Parameter) => p.Name === passwordKey).Value,
    host: result.Parameters.find((p: Parameter) => p.Name === hostKey).Value,
    port: result.Parameters.find((p: Parameter) => p.Name === portKey).Value,
  };
}

export function getAuthFrontEndUrl(): string {
  return "https://" + process.env.AUTH_FRONTEND_URL;
}

export function getAnalyticsCookieDomain(): string {
  return process.env.ANALYTICS_COOKIE_DOMAIN ?? "localhost";
}

export function getCookiesAndFeedbackLink(): string {
  return process.env.COOKIES_AND_FEEDBACK_URL;
}

export function isFargate(): boolean {
  return process.env.FARGATE === "1";
}

export function getBaseUrl(): string {
  if (isFargate()) {
    return "https://" + process.env.BASE_URL;
  } else {
    return CF_CONFIG.url;
  }
}

export function getAwsRegion(): string {
  return "eu-west-2";
}

export function getKmsKeyId(): string {
  return process.env.KMS_KEY_ID;
}
