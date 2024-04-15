import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { getNextState } from "../../utils/state-machine";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import { ChangeEmailServiceInterface } from "./types";
import { changeEmailService } from "./change-email-service";
import xss from "xss";

const TEMPLATE_NAME = "change-email/index.njk";
export async function changeEmailGet(
  req: Request,
  res: Response
): Promise<void> {
  return res.render(TEMPLATE_NAME, {
    language: req.language,
    currentUrl: req.originalUrl,
    baseUrl: req.protocol + "://" + req.hostname,
  });
}

function badRequest(req: Request, res: Response, errorMessage: string) {
  const error = formatValidationError(
    "email",
    req.t(`pages.changeEmail.email.validationError.${errorMessage}`)
  );

  return renderBadRequest(res, req, TEMPLATE_NAME, error);
}

export function changeEmailPost(
  service: ChangeEmailServiceInterface = changeEmailService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email } = req.session.user;
    const { accessToken } = req.session.user.tokens;

    const newEmailAddress = req.body.email;

    if (email.toLowerCase() === newEmailAddress.toLowerCase()) {
      return badRequest(req, res, "sameEmail");
    }

    const emailSent = await service.sendCodeVerificationNotification(
      accessToken,
      newEmailAddress,
      req.ip,
      res.locals.sessionId,
      res.locals.persistentSessionId,
      xss(req.cookies.lng as string),
      res.locals.clientSessionId
    );

    if (emailSent) {
      req.session.user.newEmailAddress = newEmailAddress;

      req.session.user.state.changeEmail = getNextState(
        req.session.user.state.changeEmail.value,
        "VERIFY_CODE_SENT"
      );
      return res.redirect(PATH_DATA.CHECK_YOUR_EMAIL.url);
    }

    return badRequest(req, res, "alreadyInUse");
  };
}
