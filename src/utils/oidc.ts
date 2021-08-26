import { Issuer, Client, custom } from "openid-client";
import { OIDCConfig } from "../types";
import pMemoize = require("p-memoize");

custom.setHttpOptionsDefaults({
  timeout: 20000,
});

async function getOIDCClient(config: OIDCConfig): Promise<Client> {
  const issuer = await Issuer.discover(config.idp_url);

  return new issuer.Client({
    client_id: config.client_id,
    redirect_uris: [config.callback_url],
    response_types: ["code"],
    token_endpoint_auth_method: "none", //allows for a custom client_assertion
    id_token_signed_response_alg: "ES256",
    scopes: config.scopes,
  });
}

const cached = pMemoize(getOIDCClient, { maxAge: 43200000 });

export { cached as getOIDCClient };
