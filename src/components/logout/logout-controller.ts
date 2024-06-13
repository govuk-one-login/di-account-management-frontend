import { Request, Response } from "express";
import { destroyUserSessions } from "../../utils/session-store.js";

export async function logoutPost(req: Request, res: Response): Promise<void> {
  const idToken = req.session.user.tokens.idToken;
  await destroyUserSessions(
    req,
    req.session.user.subjectId,
    req.app.locals.sessionStore
  );
  res.cookie("lo", "true");
  res.redirect(req.oidc.endSessionUrl({ id_token_hint: idToken }));
}
