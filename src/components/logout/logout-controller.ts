import { Request, Response } from "express";

export async function logoutGet(req: Request, res: Response): Promise<void> {
  res.redirect(
    req.oidc.endSessionUrl({ id_token_hint: req.session.user.idToken })
  );
}
