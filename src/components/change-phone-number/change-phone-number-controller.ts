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
import { validationResult } from "express-validator";
import { validationErrorFormatter } from "../../middleware/form-validation-middleware";
import { getRequestConfigFromExpress } from "../../utils/http";
import { MFA_COMMON_OPL_SETTINGS, setOplSettings } from "../../utils/opl";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const CHANGE_PHONE_NUMBER_TEMPLATE = "change-phone-number/index.njk";

const setLocalOplSettings = (req: Request, res: Response) => {
  setOplSettings(
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "a8d82f1b-c682-433b-8695-34343afb9666",
    },
    res
  );
};

export function changePhoneNumberGet(req: Request, res: Response): void {
  req.metrics?.addMetric("changePhoneNumberGet", MetricUnit.Count, 1);
  setLocalOplSettings(req, res);
  res.render(CHANGE_PHONE_NUMBER_TEMPLATE);
}

export function changePhoneNumberPost(
  service: ChangePhoneNumberServiceInterface = changePhoneNumberService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    req.metrics?.addMetric("changePhoneNumberPost", MetricUnit.Count, 1);
    setLocalOplSettings(req, res);

    const errors = validationResult(req)
      .formatWith(validationErrorFormatter)
      .mapped();

    if (!isObjectEmpty(errors)) {
      return renderBadRequest(res, req, CHANGE_PHONE_NUMBER_TEMPLATE, errors);
    }

    const { email } = req.session.user;
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
      email,
      newPhoneNumber,
      await getRequestConfigFromExpress(req, res)
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
