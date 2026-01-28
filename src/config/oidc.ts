import { OIDCConfig } from "../types";
import {
  getBaseUrl,
  getOIDCApiDiscoveryUrl,
  getOIDCClientId,
  getOIDCClientScopes,
} from "../config";
import { PATH_DATA } from "../app.constants";

export function getOIDCConfig(): OIDCConfig {
  return {
    client_id: getOIDCClientId(),
    idp_url: getOIDCApiDiscoveryUrl(),
    scopes: getOIDCClientScopes(),
    callback_url: getBaseUrl() + PATH_DATA.AUTH_CALLBACK.url,
  } as OIDCConfig;
}
