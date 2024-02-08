import { Request, Response } from "express";
import { logger } from "../../utils/logger";
import { LOG_MESSAGES } from "../../app.constants";
import { ERROR_MESSAGES } from "../../app.constants";

export async function logoutPost(req: Request, res: Response): Promise<void> {
  const idToken = req.session.user.tokens.idToken;
  logger.info(
    { trace: res.locals.trace },
    LOG_MESSAGES.ATTEMPTING_TO_DESTROY_SESSION
  );
  req.session.destroy((err) => {
    if (err) {
      logger.error(
        { trace: res.locals.trace },
        ERROR_MESSAGES.FAILED_TO_DESTROY_SESSION(err)
      );
    }
  });
  res.cookie("lo", "true");
  res.redirect(req.oidc.endSessionUrl({ id_token_hint: idToken }));
}
