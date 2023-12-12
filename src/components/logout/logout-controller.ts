import { Request, Response } from "express";
import { logger } from "../../utils/logger";

export async function logoutGet(req: Request, res: Response): Promise<void> {
  const idToken = req.session.user.tokens.idToken;
  req.session.destroy(() => logger.error("Failed to destroy session"));
  res.cookie("lo", "true");
  res.redirect(req.oidc.endSessionUrl({ id_token_hint: idToken }));
}
