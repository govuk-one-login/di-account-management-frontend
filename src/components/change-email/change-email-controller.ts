import { Request, Response } from "express";
import { PATH_DATA, ERROR_CODES } from "../../app.constants.js";
import { ExpressRouteFunc } from "../../types.js";
import { EventType, getNextState } from "../../utils/state-machine.js";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation.js";
import {
  ChangeEmailServiceInterface,
  SendCodeVerificationNotificationOutcome,
} from "./types.js";
import { changeEmailService } from "./change-email-service.js";
import { getRequestConfigFromExpress } from "../../utils/http.js";
import {
  CHANGE_EMAIL_COMMON_OPL_SETTINGS,
  setOplSettings,
} from "../../utils/opl.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { logger } from "../../utils/logger.js";

const TEMPLATE_NAME = "change-email/index.njk";
const OPL_CONTENT_ID = "1f97b62b-a124-4d6a-ae51-8abd2611ec55";

export const setLocalOplSettings = (res: Response, contentId: string) => {
  setOplSettings(
    {
      ...CHANGE_EMAIL_COMMON_OPL_SETTINGS,
      contentId: contentId,
    },
    res
  );
};

export function handleChangeEmailResponseCodes(
  req: Request,
  res: Response,
  outcome: SendCodeVerificationNotificationOutcome,
  template: string,
  contentId: string
): void {
  switch (outcome.responseCode) {
    case ERROR_CODES.ACCT_WITH_EMAIL_EXISTS:
      return badRequest(req, res, "alreadyInUse", template, contentId);
    case ERROR_CODES.INVALID_EMAIL_FORMAT:
      logger.warn(
        `Potential Frontend/API validation mismatch detected. API returned INVALID_EMAIL_FORMAT but this should have been validated on AMF: ${outcome.responseMessage}`
      );
      return badRequest(req, res, "email", template, contentId);
    case ERROR_CODES.EMAIL_ADDRESS_EMPTY:
      logger.warn(
        `Potential Frontend/API validation mismatch detected. API returned EMAIL_ADDRESS_EMPTY but this should have been validated on AMF: ${outcome.responseMessage}`
      );
      return badRequest(req, res, "required", template, contentId);
    case ERROR_CODES.REQUEST_MISSING_PARAMS:
      throw new Error(
        `Request missing params. Code: ${outcome.responseCode} message: ${outcome.responseMessage}`
      );
    case ERROR_CODES.INVALID_NOTIFICATION_TYPE:
      throw new Error(
        `Invalid notification type. Code: ${outcome.responseCode} message: ${outcome.responseMessage}`
      );
    default:
      throw new Error(
        `An error has occurred. Code: ${outcome.responseCode} message: ${outcome.responseMessage}`
      );
  }
}

export function changeEmailGet(req: Request, res: Response): void {
  req.metrics?.addMetric("changeEmailGet", MetricUnit.Count, 1);

  if (req.query.email_cant_be_used === "1") {
    return badRequest(
      req,
      res,
      "emailCantBeUsed",
      TEMPLATE_NAME,
      OPL_CONTENT_ID
    );
  }

  setLocalOplSettings(res, OPL_CONTENT_ID);
  return res.render(TEMPLATE_NAME);
}

export function badRequest(
  req: Request,
  res: Response,
  errorMessage: string,
  template: string,
  contentId: string
) {
  const error = formatValidationError(
    "email",
    req.t(`pages.changeEmail.email.validationError.${errorMessage}`)
  );

  setLocalOplSettings(res, contentId);
  return renderBadRequest(res, req, template, error);
}

export function changeEmailPost(
  service: ChangeEmailServiceInterface = changeEmailService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    req.metrics?.addMetric("changeEmailPost", MetricUnit.Count, 1);
    const { email } = req.session.user;

    const newEmailAddress = req.body.email;

    if (email.toLowerCase() === newEmailAddress.toLowerCase()) {
      return badRequest(req, res, "sameEmail", TEMPLATE_NAME, OPL_CONTENT_ID);
    }

    const emailSent = await service.sendCodeVerificationNotification(
      newEmailAddress,
      await getRequestConfigFromExpress(req, res)
    );

    if (emailSent.success) {
      req.session.user.newEmailAddress = newEmailAddress;

      req.session.user.state.changeEmail = getNextState(
        req.session.user.state.changeEmail.value,
        EventType.VerifyCodeSent
      );

      return res.redirect(PATH_DATA.CHECK_YOUR_EMAIL.url);
    } else {
      handleChangeEmailResponseCodes(
        req,
        res,
        emailSent,
        TEMPLATE_NAME,
        OPL_CONTENT_ID
      );
    }
  };
}
