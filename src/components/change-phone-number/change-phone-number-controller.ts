import { Request, Response } from "express";
import { ERROR_CODES, PATH_DATA } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ChangePhoneNumberServiceInterface } from "./types";
import { changePhoneNumberService } from "./change-phone-number-service";
import { EventType, getNextState } from "../../utils/state-machine";
import {
  formatValidationError,
  isObjectEmpty,
  renderBadRequest,
} from "../../utils/validation";
import { convertInternationalPhoneNumberToE164Format } from "../../utils/phone-number";
import { BadRequestError } from "../../utils/errors";
import xss from "xss";
import { getTxmaHeader } from "../../utils/txma-header";
import { validationResult } from "express-validator";
import { validationErrorFormatter } from "../../middleware/form-validation-middleware";

const CHANGE_PHONE_NUMBER_TEMPLATE = "change-phone-number/index.njk";

export function changePhoneNumberGet(req: Request, res: Response): void {
  res.render(CHANGE_PHONE_NUMBER_TEMPLATE);
}

export function changePhoneNumberPost(
  service: ChangePhoneNumberServiceInterface = changePhoneNumberService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const errors = validationResult(req)
      .formatWith(validationErrorFormatter)
      .mapped();

    if (!isObjectEmpty(errors)) {
      return renderBadRequest(res, req, CHANGE_PHONE_NUMBER_TEMPLATE, errors);
    }

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

      return res.redirect(
        `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=changePhoneNumber`
      );
    }

    if (response.code === ERROR_CODES.NEW_PHONE_NUMBER_SAME_AS_EXISTING) {
      const href: string =
        hasInternationalPhoneNumber && hasInternationalPhoneNumber === "true"
          ? "internationalPhoneNumber"
          : "phoneNumber";

      const error = formatValidationError(
        href,
        req.t("pages.changePhoneNumber.validationError.samePhoneNumber")
      );
      return renderBadRequest(res, req, CHANGE_PHONE_NUMBER_TEMPLATE, error);
    } else {
      throw new BadRequestError(response.message, response.code);
    }
  };
}
