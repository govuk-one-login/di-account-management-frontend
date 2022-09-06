import { Request, Response } from "express";
import { ERROR_CODES, PATH_DATA } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ChangePhoneNumberServiceInterface } from "./types";
import { changePhoneNumberService } from "./change-phone-number-service";
import { getNextState } from "../../utils/state-machine";
import { supportInternationalNumbers } from "../../config";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import { prependInternationalPrefix } from "../../utils/phone-number";
import { BadRequestError } from "../../utils/errors";
import xss from "xss";

const TEMPLATE_NAME = "change-phone-number/index.njk";

export function changePhoneNumberGet(req: Request, res: Response): void {
  res.render("change-phone-number/index.njk", {
    supportInternationalNumbers: supportInternationalNumbers() ? true : null,
  });
}

export function changePhoneNumberPost(
  service: ChangePhoneNumberServiceInterface = changePhoneNumberService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email } = req.session.user;
    const { accessToken } = req.session.user.tokens;
    const hasInternationalPhoneNumber = req.body.hasInternationalPhoneNumber;
    let newPhoneNumber;

    if (
      hasInternationalPhoneNumber &&
      hasInternationalPhoneNumber === "true" &&
      supportInternationalNumbers()
    ) {
      newPhoneNumber = prependInternationalPrefix(
        req.body.internationalPhoneNumber
      );
    } else {
      newPhoneNumber = req.body.phoneNumber;
    }

    const response = await service.sendPhoneVerificationNotification(
      accessToken,
      email,
      newPhoneNumber,
      req.ip,
      res.locals.sessionId,
      res.locals.persistentSessionId,
      xss(req.cookies.lng as string)
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
