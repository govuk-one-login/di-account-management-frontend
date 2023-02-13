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
import { redactPhoneNumber } from "../../utils/strings";
import xss from "xss";
import { UpdateInformationInput, UpdateInformationSessionValues } from "../../utils/types";

const TEMPLATE_NAME = "check-your-phone/index.njk";

export function checkYourPhoneGet(req: Request, res: Response): void {
  res.render(TEMPLATE_NAME, {
    phoneNumber: redactPhoneNumber(req.session.user.newPhoneNumber),
    resendCodeLink: PATH_DATA.RESEND_PHONE_CODE.url,
    changePhoneNumberLink: PATH_DATA.CHANGE_PHONE_NUMBER.url
  });
}

export function checkYourPhonePost(
  service: CheckYourPhoneServiceInterface = checkYourPhoneService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email, newPhoneNumber } = req.session.user;

    const updateInput : UpdateInformationInput = {
      email,
      updatedValue: newPhoneNumber,
      otp: req.body["code"]
    };

    const sessionDetails : UpdateInformationSessionValues = {
      accessToken : req.session.user.tokens,
      sourceIp: req.ip,
      sessionId: res.locals.sessionId,
      persistentSessionId : res.locals.persistentSessionId,
      userLanguage: xss(req.cookies.lng as string)
    }

    const isPhoneNumberUpdated = await service.updatePhoneNumber(
        updateInput, sessionDetails
    );

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
