import { Request, Response } from "express";
import { ERROR_CODES, mfaOplTaxonomies, PATH_DATA } from "../../app.constants";
import {
  convertInternationalPhoneNumberToE164Format,
  getLastNDigits,
} from "../../utils/phone-number";
import {
  EventType,
  getNextState,
  UserJourney,
} from "../../utils/state-machine";
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
import { getRequestConfigFromExpress } from "../../utils/http";
import { match } from "ts-pattern";

const ADD_MFA_METHOD_SMS_TEMPLATE = "add-mfa-method-sms/index.njk";

const backLink = PATH_DATA.ADD_MFA_METHOD_GO_BACK.url;

const getOplValues = (
  req: Request
):
  | { contentId: string; taxonomyLevel2?: string; taxonomyLevel3?: string }
  | undefined => {
  return match({ req })
    .when(
      ({ req }) =>
        req.session.mfaMethods.find((m) => {
          return (
            m.method.mfaMethodType === "AUTH_APP" &&
            m.priorityIdentifier === "DEFAULT"
          );
        }),

      () => ({
        contentId: "f2dd366e-19b6-47c8-a0e0-48a659d4af07",
        ...mfaOplTaxonomies,
      })
    )
    .when(
      ({ req }) =>
        req.session.mfaMethods.find((m) => {
          return (
            m.method.mfaMethodType === "SMS" &&
            m.priorityIdentifier === "DEFAULT"
          );
        }),

      () => ({
        contentId: "29895f1c-d5be-4135-8bcc-0e92c0847fa1",
        ...mfaOplTaxonomies,
      })
    )
    .otherwise((): undefined => undefined);
};

export async function addMfaSmsMethodGet(
  req: Request,
  res: Response
): Promise<void> {
  res.render(ADD_MFA_METHOD_SMS_TEMPLATE, {
    backLink,
    oplValues: getOplValues(req),
  });
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
        oplValues: getOplValues(req),
      });
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
      getRequestConfigFromExpress(req, res)
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
        req.t("pages.changePhoneNumber.validationError.samePhoneNumber")
      );
      return renderBadRequest(res, req, ADD_MFA_METHOD_SMS_TEMPLATE, error, {
        backLink,
        oplValues: getOplValues(req),
      });
    } else {
      throw new BadRequestError(response.message, response.code);
    }
  };
}

const getOplValuesForConfirmation = (
  req: Request
):
  | {
      contentId: string;
      taxonomyLevel2?: string;
      taxonomyLevel3?: string;
      loggedInStatus: boolean;
    }
  | undefined => {
  return match({ req })
    .when(
      ({ req }) =>
        req.session.mfaMethods.find((m) => {
          return (
            m.method.mfaMethodType === "AUTH_APP" &&
            m.priorityIdentifier === "DEFAULT"
          );
        }),

      () => ({
        contentId: "26dbe851-1c35-46e9-a9ee-8b4976126031",
        loggedInStatus: true,
        ...mfaOplTaxonomies,
      })
    )
    .when(
      ({ req }) =>
        req.session.mfaMethods.find((m) => {
          return (
            m.method.mfaMethodType === "SMS" &&
            m.priorityIdentifier === "DEFAULT"
          );
        }),

      () => ({
        contentId: "532a69a3-222b-4540-b9e7-35ec86960ec5",
        loggedInStatus: true,
        ...mfaOplTaxonomies,
      })
    )
    .otherwise((): undefined => undefined);
};

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
    oplValues: getOplValuesForConfirmation(req),
  });
}
