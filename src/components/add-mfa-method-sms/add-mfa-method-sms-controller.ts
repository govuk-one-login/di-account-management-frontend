import { Request, Response } from "express";
import { ERROR_CODES, PATH_DATA } from "../../app.constants";
import {
  convertInternationalPhoneNumberToE164Format,
  getLastNDigits,
} from "../../utils/phone-number";
import {
  EventType,
  getNextState,
  UserJourney,
} from "../../utils/state-machine";
import xss from "xss";
import { getTxmaHeader } from "../../utils/txma-header";
import { ChangePhoneNumberServiceInterface } from "../change-phone-number/types";
import { changePhoneNumberService } from "../change-phone-number/change-phone-number-service";
import {
  formatValidationError,
  isObjectEmpty,
  renderBadRequest,
} from "../../utils/validation";
import { BadRequestError } from "../../utils/errors";
import { validationResult } from "express-validator";
import { validationErrorFormatter } from "../../middleware/form-validation-middleware";

const ADD_MFA_METHOD_SMS_TEMPLATE = "add-mfa-method-sms/index.njk";

const backLink = PATH_DATA.ADD_MFA_METHOD_GO_BACK.url;

export async function addMfaSmsMethodGet(
  req: Request,
  res: Response
): Promise<void> {
  res.render(ADD_MFA_METHOD_SMS_TEMPLATE, { backLink });
}
export function addMfaSmsMethodPost(
  service: ChangePhoneNumberServiceInterface = changePhoneNumberService()
) {
  return async function (req: Request, res: Response): Promise<void> {
    const errors = validationResult(req)
      .formatWith(validationErrorFormatter)
      .mapped();

    if (!isObjectEmpty(errors)) {
      return renderBadRequest(res, req, ADD_MFA_METHOD_SMS_TEMPLATE, errors, {
        backLink,
      });
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
        req.session.user.state.addBackup.value,
        EventType.VerifyCodeSent
      );

      return res.redirect(
        `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=${UserJourney.addBackup}`
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
      return renderBadRequest(res, req, ADD_MFA_METHOD_SMS_TEMPLATE, error, {
        backLink,
      });
    } else {
      throw new BadRequestError(response.message, response.code);
    }
  };
}

export async function addMfaSmsMethodConfirmationGet(
  req: Request,
  res: Response
): Promise<void> {
  return res.render("common/confirmation-page/confirmation.njk", {
    pageTitleName: req.t("pages.addBackupSms.confirm.title"),
    heading: req.t("pages.addBackupSms.confirm.heading"),
    message: req
      .t("pages.addBackupSms.confirm.message")
      .replace("[mobile]", getLastNDigits(req.session.user.phoneNumber, 4)),
    backLinkText: req.t("pages.addBackupSms.confirm.backLink"),
    backLink: PATH_DATA.SECURITY.url,
  });
}
