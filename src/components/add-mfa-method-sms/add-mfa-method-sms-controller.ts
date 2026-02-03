import { Request, Response } from "express";
import { ERROR_CODES, PATH_DATA } from "../../app.constants.js";
import {
  convertInternationalPhoneNumberToE164Format,
  getLastNDigits,
} from "../../utils/phone-number.js";
import {
  EventType,
  getNextState,
  UserJourney,
} from "../../utils/state-machine.js";
import { ChangePhoneNumberServiceInterface } from "../change-phone-number/types.js";
import { changePhoneNumberService } from "../change-phone-number/change-phone-number-service.js";
import {
  formatValidationError,
  isObjectEmpty,
  renderBadRequest,
} from "../../utils/validation.js";
import { BadRequestError } from "../../utils/errors.js";
import { validationResult } from "express-validator";
import { validationErrorFormatter } from "../../middleware/form-validation-middleware.js";
import { getRequestConfigFromExpress } from "../../utils/http.js";
import {
  MFA_COMMON_OPL_SETTINGS,
  OplSettingsLookupObject,
  setOplSettings,
} from "../../utils/opl.js";
import {
  mfaMethodTypes,
  mfaPriorityIdentifiers,
} from "../../utils/mfaClient/types.js";
import { MetricUnit } from "@aws-lambda-powertools/metrics";
import { logger } from "../../utils/logger.js";

const ADD_MFA_METHOD_SMS_TEMPLATE = "add-mfa-method-sms/index.njk.js";

const backLink = PATH_DATA.ADD_MFA_METHOD_GO_BACK.url;

const ADD_MFA_SMS_METHOD_OPL_VALUES: OplSettingsLookupObject = {
  [`${mfaPriorityIdentifiers.default}_${mfaMethodTypes.authApp}`]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "f2dd366e-19b6-47c8-a0e0-48a659d4af07",
  },
  [`${mfaPriorityIdentifiers.default}_${mfaMethodTypes.sms}`]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "29895f1c-d5be-4135-8bcc-0e92c0847fa1",
  },
};

const setAddMfaSmsMethodGetOplSettings = (req: Request, res: Response) => {
  const defaultMfaMethodType = req.session.mfaMethods?.find(
    (method) => method.priorityIdentifier === mfaPriorityIdentifiers.default
  )?.method.mfaMethodType;

  const oplSettings =
    ADD_MFA_SMS_METHOD_OPL_VALUES[
      `${mfaPriorityIdentifiers.default}_${defaultMfaMethodType}`
    ];

  setOplSettings(oplSettings, res);
};

export async function addMfaSmsMethodGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("addMfaSmsMethodGet", MetricUnit.Count, 1);
  setAddMfaSmsMethodGetOplSettings(req, res);

  const hasAuthApp =
    req.session.mfaMethods?.some(
      (mfaMethod) =>
        mfaMethod.method.mfaMethodType === mfaMethodTypes.authApp &&
        mfaMethod.priorityIdentifier === mfaPriorityIdentifiers.default
    ) || false;

  res.render(ADD_MFA_METHOD_SMS_TEMPLATE, {
    isAddMfaMethodSms: true,
    hasAuthApp,
    backLink,
  });
}

export function addMfaSmsMethodPost(
  service: ChangePhoneNumberServiceInterface = changePhoneNumberService()
) {
  return async function (req: Request, res: Response): Promise<void> {
    req.metrics?.addMetric("addMfaSmsMethodPost", MetricUnit.Count, 1);
    setAddMfaSmsMethodGetOplSettings(req, res);

    const errors = validationResult(req)
      .formatWith(validationErrorFormatter)
      .mapped();

    if (!isObjectEmpty(errors)) {
      return renderBadRequest(res, req, ADD_MFA_METHOD_SMS_TEMPLATE, errors, {
        backLink,
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
      await getRequestConfigFromExpress(req, res)
    );

    if (response.success) {
      req.session.user.newPhoneNumber = newPhoneNumber;

      req.session.user.state.changePhoneNumber = getNextState(
        req.session.user.state.addBackup.value,
        EventType.VerifyCodeSent
      );

      logger.info(
        { trace: res?.locals?.trace },
        `Add MFA Method SMS POST controller req.session.user.newPhoneNumber: ${
          req.session.user.newPhoneNumber?.replace(
            /^(.{2})(.*)/,
            (_: string, first2: string, rest: string) =>
              first2 + rest.replace(/./g, "*")
          ) ?? JSON.stringify(req.session.user.newPhoneNumber)
        }`
      );

      res.redirect(
        `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=${UserJourney.addBackup}`
      );
      return;
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
      });
    } else {
      throw new BadRequestError(response.message, response.code);
    }
  };
}

const ADD_MFA_SMS_METHOD_CONFIRMATION_OPL_VALUES: OplSettingsLookupObject = {
  [`${mfaPriorityIdentifiers.default}_${mfaMethodTypes.authApp}`]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "26dbe851-1c35-46e9-a9ee-8b4976126031",
  },
  [`${mfaPriorityIdentifiers.default}_${mfaMethodTypes.sms}`]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "532a69a3-222b-4540-b9e7-35ec86960ec5",
  },
};

export async function addMfaSmsMethodConfirmationGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("addMfaSmsMethodConfirmationGet", MetricUnit.Count, 1);
  const defaultMfaMethodType = req.session.mfaMethods?.find(
    (method) => method.priorityIdentifier === mfaPriorityIdentifiers.default
  )?.method.mfaMethodType;

  setOplSettings(
    ADD_MFA_SMS_METHOD_CONFIRMATION_OPL_VALUES[
      `${mfaPriorityIdentifiers.default}_${defaultMfaMethodType}`
    ],
    res
  );

  delete req.session.user.state.changePhoneNumber;

  return res.render("update-confirmation/index.njk", {
    pageTitle: req.t("pages.addBackupSms.confirm.title"),
    panelText: req.t("pages.addBackupSms.confirm.heading"),
    summaryText: req
      .t("pages.addBackupSms.confirm.message")
      .replace("[mobile]", getLastNDigits(req.session.user.phoneNumber, 4)),
  });
}
