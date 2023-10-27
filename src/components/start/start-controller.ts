import { Request, Response } from "express";
import { generators } from "openid-client";
import { VECTORS_OF_TRUST } from "../../app.constants";

export async function startGet(req: Request, res: Response): Promise<void> {
  req.session.nonce = generators.nonce(15);
  req.session.state = generators.nonce(10);

  const authUrl = req.oidc.authorizationUrl({
    client_id: req.oidc.metadata.client_id,
    response_type: "code",
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    scope: req.oidc.metadata.scopes,
    state: req.session.state,
    nonce: req.session.nonce,
    redirect_uri: req.oidc.metadata.redirect_uris[0],
    cookie_consent: req.query.cookie_consent,
    vtr: JSON.stringify([VECTORS_OF_TRUST.MEDIUM]),
    _ga: req.query._ga,
  });

  res.redirect(authUrl);
}
