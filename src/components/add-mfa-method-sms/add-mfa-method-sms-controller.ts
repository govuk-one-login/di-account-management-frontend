import { Request, Response } from "express";
import { ERROR_CODES, PATH_DATA } from "../../app.constants";
import {
  convertInternationalPhoneNumberToE164Format,
  getLastNDigits,
} from "../../utils/phone-number";
import { EventType, getNextState } from "../../utils/state-machine";
import xss from "xss";
import { getTxmaHeader } from "../../utils/txma-header";
import { ChangePhoneNumberServiceInterface } from "../change-phone-number/types";
import { changePhoneNumberService } from "../change-phone-number/change-phone-number-service";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import { BadRequestError } from "../../utils/errors";

const CHANGE_PHONE_NUMBER_TEMPLATE = "add-mfa-method-sms/index.njk";

export async function addMfaSmsMethodGet(
  req: Request,
  res: Response
): Promise<void> {
  res.render("add-mfa-method-sms/index.njk");
}
export function addMfaSmsMethodPost(
  service: ChangePhoneNumberServiceInterface = changePhoneNumberService()
) {
  return async function (req: Request, res: Response): Promise<void> {
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
        req.session.user.state.addMfaMethod.value,
        EventType.VerifyCodeSent
      );

      return res.redirect(
        `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=addMfaMethod`
      );
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

export async function addMfaAppMethodConfirmationGet(
  req: Request,
  res: Response
): Promise<void> {
  return res.render("common/confirmation-page/confirmation.njk", {
    pageTitleName: req.t("pages.addMfaMethodSms.confirm.title"),
    heading: req.t("pages.addMfaMethodSms.confirm.heading"),
    message: req
      .t("pages.addMfaMethodSms.confirm.message")
      .replace("[mobile]", getLastNDigits(req.session.user.phoneNumber, 4)),
    backLinkText: req.t("pages.addMfaMethodSms.confirm.backLink"),
    backLink: PATH_DATA.SECURITY.url,
  });
}
