import { Request, Response } from "express";
import { ERROR_CODES, PATH_DATA } from "../../app.constants.js";
import { ExpressRouteFunc } from "../../types.js";
import { ChangePhoneNumberServiceInterface } from "./types.js";
import { changePhoneNumberService } from "./change-phone-number-service.js";
import { EventType, getNextState } from "../../utils/state-machine.js";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation.js";
import { convertInternationalPhoneNumberToE164Format } from "../../utils/phone-number.js";
import { BadRequestError } from "../../utils/errors.js";
import xss from "xss";
import { getTxmaHeader } from "../../utils/txma-header.js";

const CHANGE_PHONE_NUMBER_TEMPLATE = "change-phone-number/index.njk";

export function changePhoneNumberGet(req: Request, res: Response): void {
  res.render("change-phone-number/index.njk");
}

export function changePhoneNumberPost(
  service: ChangePhoneNumberServiceInterface = changePhoneNumberService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email } = req.session.user;
    const { accessToken } = req.session.user.tokens;
    const hasInternationalPhoneNumber = req.body.hasInternationalPhoneNumber;
    let newPhoneNumber;

    if (hasInternationalPhoneNumber === "true") {
      newPhoneNumber = convertInternationalPhoneNumberToE164Format(
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
      xss(req.cookies.lng as string),
      res.locals.clientSessionId,
      getTxmaHeader(req, res.locals.trace)
    );

    if (response.success) {
      req.session.user.newPhoneNumber = newPhoneNumber;

      req.session.user.state.changePhoneNumber = getNextState(
        req.session.user.state.changePhoneNumber.value,
        EventType.VerifyCodeSent
      );

      return res.redirect(PATH_DATA.CHECK_YOUR_PHONE.url);
    }

    if (response.code === ERROR_CODES.NEW_PHONE_NUMBER_SAME_AS_EXISTING) {
      const href: string =
        hasInternationalPhoneNumber && hasInternationalPhoneNumber === "true"
          ? "internationalPhoneNumber"
          : "phoneNumber";

      const error = formatValidationError(
        href,
        req.t(
          "pages.changePhoneNumber.ukPhoneNumber.validationError.samePhoneNumber"
        )
      );
      return renderBadRequest(res, req, CHANGE_PHONE_NUMBER_TEMPLATE, error);
    } else {
      throw new BadRequestError(response.message, response.code);
    }
  };
}
