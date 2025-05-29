import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { EventType, getNextState } from "../../utils/state-machine";
import { PATH_DATA } from "../../app.constants";
import { ChangeEmailServiceInterface } from "../change-email/types";
import { changeEmailService } from "../change-email/change-email-service";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import { getRequestConfigFromExpress } from "../../utils/http";

const TEMPLATE_NAME = "resend-email-code/index.njk";

export function resendEmailCodeGet(req: Request, res: Response): void {
  res.render(TEMPLATE_NAME, {
    emailAddress: req.session.user.newEmailAddress,
  });
}

function badRequest(req: Request, res: Response, errorMessage: string) {
  const error = formatValidationError(
    "email",
    req.t(`pages.changeEmail.email.validationError.${errorMessage}`)
  );

  return renderBadRequest(res, req, TEMPLATE_NAME, error);
}

export function resendEmailCodePost(
  service: ChangeEmailServiceInterface = changeEmailService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email, newEmailAddress } = req.session.user;

    if (email.toLowerCase() === newEmailAddress.toLowerCase()) {
      return badRequest(req, res, "sameEmail");
    }

    const emailSent = await service.sendCodeVerificationNotification(
      newEmailAddress,
      getRequestConfigFromExpress(req, res)
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
