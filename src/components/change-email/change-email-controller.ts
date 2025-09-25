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
import { getRequestConfigFromExpress } from "../../utils/http";
import {
  CHANGE_EMAIL_COMMON_OPL_SETTINGS,
  setOplSettings,
} from "../../utils/opl";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const setLocalOplSettings = (res: Response) => {
  setOplSettings(
    {
      ...CHANGE_EMAIL_COMMON_OPL_SETTINGS,
      contentId: "1f97b62b-a124-4d6a-ae51-8abd2611ec55",
    },
    res
  );
};

const TEMPLATE_NAME = "change-email/index.njk";
export function changeEmailGet(req: Request, res: Response): void {
  req.metrics?.addMetric("changeEmailGet", MetricUnit.Count, 1);

  if (req.query.email_cant_be_used === "1") {
    return badRequest(req, res, "emailCantBeUsed");
  }

  setLocalOplSettings(res);
  return res.render(TEMPLATE_NAME);
}

function badRequest(req: Request, res: Response, errorMessage: string) {
  const error = formatValidationError(
    "email",
    req.t(`pages.changeEmail.email.validationError.${errorMessage}`)
  );

  setLocalOplSettings(res);
  return renderBadRequest(res, req, TEMPLATE_NAME, error);
}

export function changeEmailPost(
  service: ChangeEmailServiceInterface = changeEmailService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    req.metrics?.addMetric("changeEmailPost", MetricUnit.Count, 1);
    const { email } = req.session.user;

    const newEmailAddress = req.body.email;

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
