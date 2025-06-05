import { Request, Response } from "express";
import { ERROR_CODES, mfaOplTaxonomies, PATH_DATA } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ChangePhoneNumberServiceInterface } from "../change-phone-number/types";
import { changePhoneNumberService } from "../change-phone-number/change-phone-number-service";
import { BadRequestError } from "../../utils/errors";
import { getLastNDigits } from "../../utils/phone-number";
import {
  EventType,
  getNextState,
  UserJourney,
} from "../../utils/state-machine";
import {
  formatValidationError,
  isObjectEmpty,
  renderBadRequest,
} from "../../utils/validation";
import { validationResult } from "express-validator";
import { validationErrorFormatter } from "../../middleware/form-validation-middleware";
import { getRequestConfigFromExpress } from "../../utils/http";
import { match, P } from "ts-pattern";
import { Intent } from "../check-your-email/types";

const TEMPLATE_NAME = "resend-phone-code/index.njk";

const getOplValues = (
  req: Request,
  intent: Intent
):
  | { contentId: string; taxonomyLevel2?: string; taxonomyLevel3?: string }
  | undefined => {
  return match({ req, intent })
    .with(
      {
        intent: UserJourney.ChangePhoneNumber,
      },
      () => ({
        contentId: "2af1424d-dcd1-46c7-b982-4b4b11e039f0",
        ...mfaOplTaxonomies,
      })
    )
    .with(
      {
        intent: UserJourney.ChangeDefaultMethod,
      },
      () => ({
        contentId: "0b1e6d65-b6f3-4302-970c-078829291db3",
        ...mfaOplTaxonomies,
      })
    )
    .with(
      {
        intent: UserJourney.addBackup,
        req: P.when((req) =>
          req.session.mfaMethods.find((m) => {
            return (
              m.method.mfaMethodType === "AUTH_APP" &&
              m.priorityIdentifier === "DEFAULT"
            );
          })
        ),
      },
      () => ({
        contentId: "14965b57-209d-4522-876f-a6fbd387c710",
        ...mfaOplTaxonomies,
      })
    )
    .with(
      {
        intent: UserJourney.addBackup,
        req: P.when((req) =>
          req.session.mfaMethods.find((m) => {
            return (
              m.method.mfaMethodType === "SMS" &&
              m.priorityIdentifier === "DEFAULT"
            );
          })
        ),
      },
      () => ({
        contentId: "ebe3ea82-10ee-4ff3-a0b8-db493e3a93bb",
        ...mfaOplTaxonomies,
      })
    )
    .otherwise((): undefined => undefined);
};

const getRenderOptions = (req: Request) => {
  const intent = req.query.intent as Intent;

  return {
    phoneNumberRedacted: getLastNDigits(req.session.user.newPhoneNumber, 4),
    phoneNumber: req.session.user.newPhoneNumber,
    intent,
    backLink: `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=${intent}`,
    oplValues: getOplValues(req, intent),
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
    const intent = req.body.intent;
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
        getRenderOptions(req)
      );
    } else {
      throw new BadRequestError(response.message, response.code);
    }
  };
}
