import { Request, Response } from "express";
import { ERROR_CODES, PATH_DATA } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ChangePhoneNumberServiceInterface } from "../change-phone-number/types";
import { changePhoneNumberService } from "../change-phone-number/change-phone-number-service";
import { BadRequestError } from "../../utils/errors";
import { getLastNDigits } from "../../utils/phone-number";
import { EventType, getNextState } from "../../utils/state-machine";
import {
  formatValidationError,
  isObjectEmpty,
  renderBadRequest,
} from "../../utils/validation";
import { validationResult } from "express-validator";
import { validationErrorFormatter } from "../../middleware/form-validation-middleware";
import { getRequestConfigFromExpress } from "../../utils/http";
import {
  MFA_COMMON_OPL_SETTINGS,
  OplSettings,
  setOplSettings,
} from "../../utils/opl";
import {
  mfaMethodTypes,
  mfaPriorityIdentifiers,
} from "../../utils/mfaClient/types";
import {
  Intent,
  INTENT_ADD_BACKUP,
  INTENT_CHANGE_DEFAULT_METHOD,
  INTENT_CHANGE_PHONE_NUMBER,
} from "../check-your-email/types";
import { supportMfaManagement } from "../../config";

const TEMPLATE_NAME = "resend-phone-code/index.njk";

const OPL_VALUES: Record<string, Partial<OplSettings>> = {
  [`${INTENT_ADD_BACKUP}_${mfaPriorityIdentifiers.default}_${mfaMethodTypes.authApp}`]:
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "14965b57-209d-4522-876f-a6fbd387c710",
    },
  [`${INTENT_ADD_BACKUP}_${mfaPriorityIdentifiers.default}_${mfaMethodTypes.sms}`]:
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "ebe3ea82-10ee-4ff3-a0b8-db493e3a93bb",
    },
  [`${INTENT_CHANGE_DEFAULT_METHOD}_${mfaPriorityIdentifiers.default}_${mfaMethodTypes.authApp}`]:
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "0b1e6d65-b6f3-4302-970c-078829291db3",
    },
  [`${INTENT_CHANGE_PHONE_NUMBER}_${mfaPriorityIdentifiers.default}_${mfaMethodTypes.sms}`]:
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "2af1424d-dcd1-46c7-b982-4b4b11e039f0",
    },
};

const setLocalOplSettings = (intent: Intent, req: Request, res: Response) => {
  if (!supportMfaManagement()) {
    setOplSettings(
      {
        contentId: "e92e3a80-ea97-4eae-bbff-903e89291765",
        taxonomyLevel2: "change phone number",
      },
      res
    );
  } else {
    const defaultMfaMethodType = req.session.mfaMethods?.find(
      (method) => method.priorityIdentifier === mfaPriorityIdentifiers.default
    )?.method.mfaMethodType;
    const oplSettings =
      OPL_VALUES[
        `${intent}_${mfaPriorityIdentifiers.default}_${defaultMfaMethodType}`
      ];

    setOplSettings(oplSettings, res);
  }
};

const getRenderOptions = (req: Request, intent: Intent) => {
  return {
    phoneNumberRedacted: getLastNDigits(req.session.user.newPhoneNumber, 4),
    phoneNumber: req.session.user.newPhoneNumber,
    intent,
    backLink: `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=${intent}`,
  };
};

export function resendPhoneCodeGet(req: Request, res: Response): void {
  const intent = req.query.intent as Intent;

  setLocalOplSettings(intent, req, res);
  res.render(TEMPLATE_NAME, getRenderOptions(req, intent));
}

export function resendPhoneCodePost(
  service: ChangePhoneNumberServiceInterface = changePhoneNumberService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const intent = req.body.intent;

    setLocalOplSettings(intent, req, res);

    const errors = validationResult(req)
      .formatWith(validationErrorFormatter)
      .mapped();

    if (!isObjectEmpty(errors)) {
      return renderBadRequest(
        res,
        req,
        TEMPLATE_NAME,
        errors,
        getRenderOptions(req, intent)
      );
    }

    const { email } = req.session.user;
    const newPhoneNumber = req.body.phoneNumber;
    const response = await service.sendPhoneVerificationNotification(
      email,
      newPhoneNumber,
      getRequestConfigFromExpress(req, res)
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
        getRenderOptions(req, intent)
      );
    } else {
      throw new BadRequestError(response.message, response.code);
    }
  };
}
