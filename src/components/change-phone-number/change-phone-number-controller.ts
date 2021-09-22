import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ChangePhoneNumberServiceInterface } from "./types";
import { changePhoneNumberService } from "./change-phone-number-service";
import { getNextState } from "../../utils/state-machine";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";

const TEMPLATE_NAME = "change-phone-number/index.njk";

export function changePhoneNumberGet(req: Request, res: Response): void {
  res.render("change-phone-number/index.njk");
}

export function changePhoneNumberPost(
  service: ChangePhoneNumberServiceInterface = changePhoneNumberService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email, phoneNumber } = req.session.user;
    const { accessToken } = req.session.user.tokens;

    const newPhoneNumber = req.body.phoneNumber;

    if (phoneNumber === newPhoneNumber) {
      const error = formatValidationError(
        "phoneNumber",
        req.t(
          "pages.changePhoneNumber.phoneNumber.validationError.samePhoneNumber"
        )
      );

      return renderBadRequest(res, req, TEMPLATE_NAME, error);
    }

    await service.sendPhoneVerificationNotification(
      accessToken,
      email,
      newPhoneNumber
    );

    req.session.user.newPhoneNumber = newPhoneNumber;

    req.session.user.state.changePhoneNumber = getNextState(
      req.session.user.state.changePhoneNumber.value,
      "VERIFY_CODE_SENT"
    );

    res.redirect(PATH_DATA.CHECK_YOUR_PHONE.url);
  };
}
