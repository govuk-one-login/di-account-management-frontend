import { Request, Response } from "express";

export async function logoutGet(req: Request, res: Response): Promise<void> {
  const idToken = req.session.user.tokens.idToken;
  req.session.destroy();
  res.cookie("lo", "true");
  res.redirect(req.oidc.endSessionUrl({ id_token_hint: idToken }));
}
