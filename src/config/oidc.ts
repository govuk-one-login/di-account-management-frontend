import { OIDCConfig } from "../types";
import CF_CONFIG from "./cf";
import {
  getBaseUrl,
  getOIDCApiDiscoveryUrl,
  getOIDCClientId,
  getOIDCClientScopes,
  isFargate,
} from "../config";

export function getOIDCConfig(): OIDCConfig {
  const callBackUrl = getBaseUrl() + "/auth/callback";
  if (CF_CONFIG.isLocal || isFargate()) {
    return {
      client_id: getOIDCClientId(),
      idp_url: getOIDCApiDiscoveryUrl(),
      scopes: getOIDCClientScopes(),
      callback_url: callBackUrl,
    } as OIDCConfig;
  }

  const config = CF_CONFIG.getServiceCreds(
    /-account-management-idp-provider$/gims
  ) as OIDCConfig;

  config.callback_url = callBackUrl;
  config.scopes = (config.scopes as string[]).join(" ");

  return config;
}
