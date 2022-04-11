import { Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../../app.constants";
import { LogoutToken } from "./types";
const jose = require('jose')

const verifyLogoutToken = async (req: Request): Promise<LogoutToken> => {
  if (!(req.body && Object.keys(req.body).includes("logout_token"))) {
    return undefined;
  }
  try {
    const token = await jose.JWT.LogoutToken.verify(
      req.body.logout_token,
      "",
      {
        issuer: req.oidc.issuer.metadata.issuer,
        audience: req.oidc.metadata.client_id,
        algorithms: [req.oidc.metadata.id_token_signed_response_alg]
      });

    return token.payload;
  } catch (e) {
    req.log.error(`Unable to validate logout_token. Error:${e.message}`);
    return undefined;
  }
};

export async function globalLogoutPost(req: Request, res: Response): Promise<void> {

  const token = await verifyLogoutToken(req);

  if (token) {
    res.status(HTTP_STATUS_CODES.OK);
    return;
  }
  res.status(HTTP_STATUS_CODES.UNAUTHORIZED);

}
