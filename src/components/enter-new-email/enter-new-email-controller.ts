import { Request, Response } from "express";
import { PATH_NAMES } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { enterNewEmailService } from "./enter-new-email-service";
import { EnterNewEmailServiceInterface } from "./types";

export function enterNewEmailGet(req: Request, res: Response): void {
  return res.render("enter-new-email/index.njk");
}

export function enterNewEmailPost(
  service: EnterNewEmailServiceInterface = enterNewEmailService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const accessToken = req.session.user.accessToken;
    const existingEmail = req.session.user.email;
    const replacementEmail = req.body.email;

    service.updateEmail(accessToken, existingEmail, replacementEmail);

    return res.redirect(PATH_NAMES.EMAIL_UPDATED_CONFIRMATION);
  };
}
