import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { EventType, getNextState } from "../../utils/state-machine";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import { ChangeEmailServiceInterface } from "./types";
import { changeEmailService } from "./change-email-service";
import xss from "xss";
import { getTxmaHeader } from "../../utils/txma-header";

const TEMPLATE_NAME = "change-email/index.njk";
export function changeEmailGet(req: Request, res: Response): void {
  return res.render(TEMPLATE_NAME);
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
      newEmailAddress,
      {
        token: accessToken,
        sourceIp: req.ip,
        sessionId: res.locals.sessionId,
        persistentSessionId: res.locals.persistentSessionId,
        userLanguage: xss(req.cookies.lng as string),
        clientSessionId: res.locals.clientSessionId,
        txmaAuditEncoded: getTxmaHeader(req, res.locals.trace),
      }
    );

    if (emailSent) {
      req.session.user.newEmailAddress = newEmailAddress;

      req.session.user.state.changeEmail = getNextState(
        req.session.user.state.changeEmail.value,
        EventType.VerifyCodeSent
      );

      return res.redirect(PATH_DATA.CHECK_YOUR_EMAIL.url);
    }

    return badRequest(req, res, "alreadyInUse");
  };
}
