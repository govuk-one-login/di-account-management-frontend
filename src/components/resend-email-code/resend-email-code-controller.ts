import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types.js";
import { EventType, getNextState } from "../../utils/state-machine.js";
import { PATH_DATA } from "../../app.constants.js";
import { ChangeEmailServiceInterface } from "../change-email/types.js";
import { changeEmailService } from "../change-email/change-email-service.js";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation.js";
import { getRequestConfigFromExpress } from "../../utils/http.js";
import {
  CHANGE_EMAIL_COMMON_OPL_SETTINGS,
  setOplSettings,
} from "../../utils/opl.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const TEMPLATE_NAME = "resend-email-code/index.njk";

const setLocalOplSettings = (res: Response) => {
  setOplSettings(
    {
      ...CHANGE_EMAIL_COMMON_OPL_SETTINGS,
      contentId: "24ad9e0f-9d6f-43d2-8828-5d8f2003c6fe",
    },
    res
  );
};

export function resendEmailCodeGet(req: Request, res: Response): void {
  req.metrics?.addMetric("resendEmailCodeGet", MetricUnit.Count, 1);
  setLocalOplSettings(res);
  res.render(TEMPLATE_NAME, {
    emailAddress: req.session.user.newEmailAddress,
  });
}

function badRequest(req: Request, res: Response, errorMessage: string) {
  const error = formatValidationError(
    "email",
    req.t(`pages.changeEmail.email.validationError.${errorMessage}`)
  );

  setLocalOplSettings(res);

  return renderBadRequest(res, req, TEMPLATE_NAME, error);
}

export function resendEmailCodePost(
  service: ChangeEmailServiceInterface = changeEmailService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    req.metrics?.addMetric("resendEmailCodePost", MetricUnit.Count, 1);
    const { email, newEmailAddress } = req.session.user;

    if (email.toLowerCase() === newEmailAddress.toLowerCase()) {
      return badRequest(req, res, "sameEmail");
    }

    const emailSent = await service.sendCodeVerificationNotification(
      newEmailAddress,
      await getRequestConfigFromExpress(req, res)
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
