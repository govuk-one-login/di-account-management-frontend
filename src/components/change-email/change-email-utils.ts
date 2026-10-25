import { Request, Response } from "express";
import { getRequestConfigFromExpress } from "../../utils/http.js";
import {
  CHANGE_EMAIL_COMMON_OPL_SETTINGS,
  setOplSettings,
} from "../../utils/opl.js";
import { PATH_DATA, ERROR_CODES } from "../../app.constants.js";
import { EventType, getNextState } from "../../utils/state-machine.js";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation.js";
import {
  ChangeEmailServiceInterface,
  SendCodeVerificationNotificationOutcome,
} from "./types.js";
import { logger } from "../../utils/logger.js";

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

export async function handleEmailVerificationSubmission({
  req,
  res,
  service,
  oplContentId,
  newEmailAddress,
  templateName,
}: {
  req: Request;
  res: Response;
  service: ChangeEmailServiceInterface;
  templateName: string;
  oplContentId: string;
  newEmailAddress: string;
}) {
  const { email } = req.session.user;

  if (email.toLowerCase() === newEmailAddress.toLowerCase()) {
    return badRequest(req, res, "sameEmail", templateName, oplContentId);
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
      templateName,
      oplContentId
    );
  }
}
