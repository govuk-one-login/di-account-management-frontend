import { Request, Response } from "express";
import { NOTIFICATION_TYPE, PATH_DATA } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { getNextState } from "../../utils/state-machine";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import { ChangeEmailServiceInterface } from "./types";
import { changeEmailService } from "./change-email-service";

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
    const { accessToken, email } = req.session.user;
    const newEmailAddress = req.body.email;

    if (email.toLowerCase() === newEmailAddress.toLowerCase()) {
      return badRequest(req, res, "sameEmail");
    }

    const emailSent = await service.sendCodeVerificationNotification(
      accessToken,
      newEmailAddress,
      NOTIFICATION_TYPE.VERIFY_EMAIL
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
