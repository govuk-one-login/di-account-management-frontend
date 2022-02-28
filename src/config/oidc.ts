import { OIDCConfig } from "../types";
import {
  getBaseUrl,
  getOIDCApiDiscoveryUrl,
  getOIDCClientId,
  getOIDCClientScopes,
} from "../config";

export function getOIDCConfig(): OIDCConfig {
  return {
    client_id: getOIDCClientId(),
    idp_url: getOIDCApiDiscoveryUrl(),
    scopes: getOIDCClientScopes(),
    callback_url: getBaseUrl() + "/auth/callback",
  } as OIDCConfig;
}
