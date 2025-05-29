import { Request, Response } from "express";
import { ERROR_CODES, PATH_DATA } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ChangePhoneNumberServiceInterface } from "../change-phone-number/types";
import { changePhoneNumberService } from "../change-phone-number/change-phone-number-service";
import { BadRequestError } from "../../utils/errors";
import { getLastNDigits } from "../../utils/phone-number";
import { EventType, getNextState } from "../../utils/state-machine";
import xss from "xss";
import {
  formatValidationError,
  isObjectEmpty,
  renderBadRequest,
} from "../../utils/validation";
import { getTxmaHeader } from "../../utils/txma-header";
import { validationResult } from "express-validator";
import { validationErrorFormatter } from "../../middleware/form-validation-middleware";

const TEMPLATE_NAME = "resend-phone-code/index.njk";

const getRenderOptions = (req: Request) => {
  const intent = req.query.intent as string;

  return {
    phoneNumberRedacted: getLastNDigits(req.session.user.newPhoneNumber, 4),
    phoneNumber: req.session.user.newPhoneNumber,
    intent,
    backLink: `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=${intent}`,
  };
};

export function resendPhoneCodeGet(req: Request, res: Response): void {
  res.render(TEMPLATE_NAME, getRenderOptions(req));
}

export function resendPhoneCodePost(
  service: ChangePhoneNumberServiceInterface = changePhoneNumberService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const errors = validationResult(req)
      .formatWith(validationErrorFormatter)
      .mapped();

    if (!isObjectEmpty(errors)) {
      return renderBadRequest(
        res,
        req,
        TEMPLATE_NAME,
        errors,
        getRenderOptions(req)
      );
    }

    const { email } = req.session.user;
    const { accessToken } = req.session.user.tokens;
    const intent = req.body.intent;
    const newPhoneNumber = req.body.phoneNumber;
    const response = await service.sendPhoneVerificationNotification(
      email,
      newPhoneNumber,
      {
        token: accessToken,
        sourceIp: req.ip,
        sessionId: res.locals.sessionId,
        persistentSessionId: res.locals.persistentSessionId,
        userLanguage: xss(req.cookies.lng as string),
        clientSessionId: res.locals.clientSessionId,
        txmaAuditEncoded: getTxmaHeader(req, res.locals.trace),
      }
    );

    if (response.success) {
      req.session.user.newPhoneNumber = newPhoneNumber;

      req.session.user.state.changePhoneNumber = getNextState(
        req.session.user.state.changePhoneNumber.value,
        EventType.VerifyCodeSent
      );

      return res.redirect(`${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=${intent}`);
    }

    if (response.code === ERROR_CODES.NEW_PHONE_NUMBER_SAME_AS_EXISTING) {
      const error = formatValidationError(
        "phoneNumber",
        req.t("pages.changePhoneNumber.validationError.samePhoneNumber")
      );
      return renderBadRequest(
        res,
        req,
        TEMPLATE_NAME,
        error,
        getRenderOptions(req)
      );
    } else {
      throw new BadRequestError(response.message, response.code);
    }
  };
}
