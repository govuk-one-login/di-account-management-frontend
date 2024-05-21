import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { PATH_DATA } from "../../app.constants";
import { CheckYourPhoneServiceInterface } from "./types";
import { getNextState } from "../../utils/state-machine";
import { checkYourPhoneService } from "./check-your-phone-service";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import { getLastNDigits } from "../../utils/phone-number";
import xss from "xss";
import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../../utils/types";
import { getTxmaHeader } from "../../utils/txma-header";
import { MfaMethod } from "../../utils/mfa/types";
import { supportChangeMfa } from "../../config";

const TEMPLATE_NAME = "check-your-phone/index.njk";

export function checkYourPhoneGet(req: Request, res: Response): void {
  res.render(TEMPLATE_NAME, {
    phoneNumber: getLastNDigits(req.session.user.newPhoneNumber, 4),
    resendCodeLink: PATH_DATA.RESEND_PHONE_CODE.url,
    changePhoneNumberLink: PATH_DATA.CHANGE_PHONE_NUMBER.url,
  });
}

export function checkYourPhonePost(
  service: CheckYourPhoneServiceInterface = checkYourPhoneService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email, newPhoneNumber } = req.session.user;

    const updateInput: UpdateInformationInput = {
      email,
      updatedValue: newPhoneNumber,
      otp: req.body["code"],
    };

    const sessionDetails: UpdateInformationSessionValues = {
      accessToken: req.session.user.tokens.accessToken,
      sourceIp: req.ip,
      sessionId: res.locals.sessionId,
      persistentSessionId: res.locals.persistentSessionId,
      userLanguage: xss(req.cookies.lng as string),
      clientSessionId: res.locals.clientSessionId,
      txmaAuditEncoded: getTxmaHeader(req, res.locals.trace),
    };

    let isPhoneNumberUpdated = false;
    if (supportChangeMfa()) {
      const smsMFAMethod: MfaMethod = req.session.mfaMethods.find(
        (mfa) => mfa.mfaMethodType === "SMS"
      );
      if (smsMFAMethod) {
        updateInput.mfaMethod = smsMFAMethod;
        isPhoneNumberUpdated = await service.updatePhoneNumberWithMfaApi(
          updateInput,
          sessionDetails
        );
      } else {
        throw Error(`No existing MFA method for: ${email}`);
      }
    } else {
      isPhoneNumberUpdated = await service.updatePhoneNumber(
        updateInput,
        sessionDetails
      );
    }

    if (isPhoneNumberUpdated) {
      req.session.user.phoneNumber = newPhoneNumber;
      delete req.session.user.newPhoneNumber;

      req.session.user.state.changePhoneNumber = getNextState(
        req.session.user.state.changePhoneNumber.value,
        "VALUE_UPDATED"
      );

      return res.redirect(PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url);
    }

    const error = formatValidationError(
      "code",
      req.t("pages.checkYourPhone.code.validationError.invalidCode")
    );

    renderBadRequest(res, req, TEMPLATE_NAME, error);
  };
}

export function requestNewOTPCodeGet(req: Request, res: Response): void {
  req.session.user.state.changePhoneNumber = getNextState(
    req.session.user.state.changePhoneNumber.value,
    "RESEND_CODE"
  );

  return res.redirect(PATH_DATA.CHANGE_PHONE_NUMBER.url);
}
