import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import {ERROR_CODES, getErrorPathByCode, PATH_DATA} from "../../app.constants";
import { CheckYourPhoneServiceInterface } from "./types";
import { getNextState } from "../../utils/state-machine";
import { checkYourPhoneService } from "./check-your-phone-service";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import { redactPhoneNumber } from "../../utils/strings";
import {BadRequestError} from "../../utils/errors";

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

    const response = await service.updatePhoneNumber(
      accessToken,
      email,
      newPhoneNumber,
      code,
      req.ip,
      res.locals.sessionId,
      res.locals.persistentSessionId
    );

    if (response.success) {
      req.session.user.phoneNumber = newPhoneNumber;
      delete req.session.user.newPhoneNumber;

      req.session.user.state.changePhoneNumber = getNextState(
        req.session.user.state.changePhoneNumber.value,
        "VALUE_UPDATED"
      );

      return res.redirect(PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url);
    }
    if (response.code === ERROR_CODES.INVALID_OTP_CODE) {
      const error = formatValidationError(
          "code",
          req.t("pages.checkYourPhone.code.validationError.invalidCode")
      );

      renderBadRequest(res, req, TEMPLATE_NAME, error);
    }

    const path = getErrorPathByCode(response.code);

    if (path) {
      return res.redirect(path);
    }

    throw new BadRequestError(response.message, response.code);
  };
}

export function requestNewOTPCodeGet(req: Request, res: Response): void {
  req.session.user.state.changePhoneNumber = getNextState(
    req.session.user.state.changePhoneNumber.value,
    "RESEND_CODE"
  );

  return res.redirect(PATH_DATA.CHANGE_PHONE_NUMBER.url);
}
