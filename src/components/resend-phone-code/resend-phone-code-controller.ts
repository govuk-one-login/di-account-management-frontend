import { Request, Response } from "express";
import { ERROR_CODES, PATH_DATA } from "../../app.constants";
import { redactPhoneNumber } from "../../utils/strings";
import { ExpressRouteFunc } from "../../types";
import { ChangePhoneNumberServiceInterface } from "../change-phone-number/types";
import { changePhoneNumberService } from "../change-phone-number/change-phone-number-service";
import { BadRequestError } from "../../utils/errors";
import { getNextState } from "../../utils/state-machine";
import xss from "xss";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";

const TEMPLATE_NAME = "resend-phone-code/index.njk";

export function resendPhoneCodeGet(req: Request, res: Response): void {
  res.render(TEMPLATE_NAME, {
    phoneNumberRedacted: redactPhoneNumber(req.session.user.newPhoneNumber),
    phoneNumber: req.session.user.newPhoneNumber,
    language: req.language,
    currentUrl: req.originalUrl,
    baseUrl: req.protocol + "://" + req.hostname,
  });
}

export function resendPhoneCodePost(
  service: ChangePhoneNumberServiceInterface = changePhoneNumberService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email } = req.session.user;
    const { accessToken } = req.session.user.tokens;
    const newPhoneNumber = req.body.phoneNumber;
    const response = await service.sendPhoneVerificationNotification(
      accessToken,
      email,
      newPhoneNumber,
      req.ip,
      res.locals.sessionId,
      res.locals.persistentSessionId,
      xss(req.cookies.lng as string),
      res.locals.clientSessionId
    );

    if (response.success) {
      req.session.user.newPhoneNumber = newPhoneNumber;

      req.session.user.state.changePhoneNumber = getNextState(
        req.session.user.state.changePhoneNumber.value,
        "VERIFY_CODE_SENT"
      );

      return res.redirect(PATH_DATA.CHECK_YOUR_PHONE.url);
    }

    if (response.code === ERROR_CODES.NEW_PHONE_NUMBER_SAME_AS_EXISTING) {
      const error = formatValidationError(
        "phoneNumber",
        req.t(
          "pages.changePhoneNumber.ukPhoneNumber.validationError.samePhoneNumber"
        )
      );
      return renderBadRequest(res, req, TEMPLATE_NAME, error);
    } else {
      throw new BadRequestError(response.message, response.code);
    }
  };
}
