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

const TEMPLATE_NAME = "check-your-phone/index.njk";

export function checkYourPhoneGet(req: Request, res: Response): void {
  res.render(TEMPLATE_NAME, {
    phoneNumber: redactPhoneNumber(req.session.user.newPhoneNumber),
  });
}

export function checkYourPhonePost(
  service: CheckYourPhoneServiceInterface = checkYourPhoneService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const code = req.body["code"];
    const { email, newPhoneNumber } = req.session.user;
    const { accessToken } = req.session.user.tokens;

    const isPhoneNumberUpdated = await service.updatePhoneNumber(
      accessToken,
      email,
      newPhoneNumber,
      code
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
