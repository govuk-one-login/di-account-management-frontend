import { Request, Response } from "express";
import { generators } from "openid-client";
import { getOIDCClientScopes } from "../../config";

export async function startGet(req: Request, res: Response): Promise<void> {
  req.session.nonce = generators.nonce(15);
  req.session.state = generators.nonce(10);

  const authUrl = req.oidc.authorizationUrl({
    client_id: req.oidc.metadata.client_id,
    response_type: "code",
    scope: getOIDCClientScopes(),
    state: req.session.state,
    nonce: req.session.nonce,
    redirect_uri: req.oidc.metadata.redirect_uris[0],
  });

  res.redirect(authUrl);
}
