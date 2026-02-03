import { OIDCConfig } from "../types.js";
import {
  getBaseUrl,
  getOIDCApiDiscoveryUrl,
  getOIDCClientId,
  getOIDCClientScopes,
} from "../config.js";

export function getOIDCConfig(): OIDCConfig {
  return {
    client_id: getOIDCClientId(),
    idp_url: getOIDCApiDiscoveryUrl(),
    scopes: getOIDCClientScopes(),
    callback_url: getBaseUrl() + PATH_DATA.AUTH_CALLBACK.url,
  } as OIDCConfig;
}
