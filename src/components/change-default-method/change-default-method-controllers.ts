import { NextFunction, Request, Response } from "express";
import {
  convertInternationalPhoneNumberToE164Format,
  getLastNDigits,
} from "../../utils/phone-number.js";
import {
  handleMfaMethodPage,
  renderMfaMethodPage,
} from "../common/mfa/index.js";
import { EventType, getNextState } from "../../utils/state-machine.js";
import { ERROR_CODES, PATH_DATA } from "../../app.constants.js";
import { ChangePhoneNumberServiceInterface } from "../change-phone-number/types.js";
import { changePhoneNumberService } from "../change-phone-number/change-phone-number-service.js";
import {
  formatValidationError,
  isObjectEmpty,
  renderBadRequest,
} from "../../utils/validation.js";
import { BadRequestError } from "../../utils/errors.js";
import {
  createMfaClient,
  formatErrorMessage,
} from "../../utils/mfaClient/index.js";
import { logger } from "../../utils/logger.js";
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

const ADD_APP_TEMPLATE = "change-default-method/change-to-app.njk";
const CHANGE_DEFAULT_METHOD_SMS_TEMPLATE =
  "change-default-method/change-to-sms.njk";

const backLink = PATH_DATA.CHANGE_DEFAULT_METHOD.url;

const CHANGE_DEFAULT_METHOD_OPL_VALUES: OplSettingsLookupObject = {
  [`${mfaPriorityIdentifiers.default}_${mfaMethodTypes.authApp}`]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "1c044729-69ca-488f-bf1f-40d6df909deb",
  },
  [`${mfaPriorityIdentifiers.default}_${mfaMethodTypes.sms}`]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "edada29a-9cca-4b59-9d0b-86a1af67cf68",
  },
};

export async function changeDefaultMethodGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("changeDefaultMethodGet", MetricUnit.Count, 1);
  const defaultMethod = req.session.mfaMethods.find(
    (method) => method.priorityIdentifier === "DEFAULT"
  );

  if (!defaultMethod) {
    res.status(404);
    return;
  }

  const oplSettings =
    CHANGE_DEFAULT_METHOD_OPL_VALUES[
      `${mfaPriorityIdentifiers.default}_${defaultMethod.method.mfaMethodType}`
    ];
  setOplSettings(oplSettings, res);

  const data = {
    currentMethodType: defaultMethod.method.mfaMethodType,
    phoneNumber:
      defaultMethod.method.mfaMethodType === "SMS"
        ? getLastNDigits(defaultMethod.method.phoneNumber, 4)
        : null,
  };

  res.render("change-default-method/index.njk", data);
}

const setChangeDefaultMethodAppOplSettings = (res: Response) => {
  setOplSettings(
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "5ca73acd-4c03-479e-b937-2abd899a6590",
    },

    res
  );
};

export async function changeDefaultMethodAppGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  req.metrics?.addMetric("changeDefaultMethodAppGet", MetricUnit.Count, 1);
  setChangeDefaultMethodAppOplSettings(res);
  return renderMfaMethodPage(
    ADD_APP_TEMPLATE,
    req,
    res,
    next,
    undefined,
    backLink
  );
}

const setChangeDefaultMethodSmsOplSettings = (req: Request, res: Response) => {
  setOplSettings(
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "e847d040-e59e-4a88-8f9c-1d00a840d0bd",
    },
    res
  );
};

export async function changeDefaultMethodSmsGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("changeDefaultMethodAppGet", MetricUnit.Count, 1);
  setChangeDefaultMethodSmsOplSettings(req, res);
  return res.render(CHANGE_DEFAULT_METHOD_SMS_TEMPLATE, {
    backLink,
  });
}

export function changeDefaultMethodSmsPost(
  service: ChangePhoneNumberServiceInterface = changePhoneNumberService()
) {
  return async function (req: Request, res: Response): Promise<void> {
    req.metrics?.addMetric("changeDefaultMethodSmsPost", MetricUnit.Count, 1);
    setChangeDefaultMethodSmsOplSettings(req, res);

    const errors = validationResult(req)
      .formatWith(validationErrorFormatter)
      .mapped();

    if (!isObjectEmpty(errors)) {
      return renderBadRequest(
        res,
        req,
        CHANGE_DEFAULT_METHOD_SMS_TEMPLATE,
        errors,
        { backLink }
      );
    }

    const {
      hasInternationalPhoneNumber,
      internationalPhoneNumber,
      phoneNumber,
    } = req.body;
    const { email } = req.session.user;
    const newPhoneNumber =
      hasInternationalPhoneNumber === "true"
        ? convertInternationalPhoneNumberToE164Format(internationalPhoneNumber)
        : phoneNumber;

    const response = await service.sendPhoneVerificationNotification(
      email,
      newPhoneNumber,
      await getRequestConfigFromExpress(req, res)
    );

    if (response.success) {
      req.session.user.newPhoneNumber = newPhoneNumber;

      req.session.user.state.changePhoneNumber = getNextState(
        req.session.user.state.changeDefaultMethod.value,
        EventType.VerifyCodeSent
      );

      return res.redirect(
        `${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=changeDefaultMethod`
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
      return renderBadRequest(
        res,
        req,
        CHANGE_DEFAULT_METHOD_SMS_TEMPLATE,
        error,
        {
          backLink,
        }
      );
    } else {
      throw new BadRequestError(response.message, response.code);
    }
  };
}

export async function changeDefaultMethodAppPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  req.metrics?.addMetric("changeDefaultMethodAppPost", MetricUnit.Count, 1);
  setChangeDefaultMethodAppOplSettings(res);
  return handleMfaMethodPage(
    ADD_APP_TEMPLATE,
    req,
    res,
    next,
    async () => {
      const { authAppSecret } = req.body;

      const currentDefaultMethod = req.session.mfaMethods.find(
        (mfa) => mfa.priorityIdentifier == "DEFAULT"
      );

      if (!currentDefaultMethod) {
        throw new Error(
          "Could not change default method - no current default method found"
        );
      }

      const mfaClient = await createMfaClient(req, res);
      const response = await mfaClient.update({
        mfaIdentifier: currentDefaultMethod.mfaIdentifier,
        priorityIdentifier: "DEFAULT",
        method: {
          mfaMethodType: "AUTH_APP",
          credential: authAppSecret,
        },
      });

      if (response.success) {
        req.session.user.state.changeDefaultMethod = getNextState(
          req.session.user.state.changeDefaultMethod.value,
          EventType.ValueUpdated
        );

        res.redirect(PATH_DATA.CHANGE_DEFAULT_METHOD_CONFIRMATION.url);
      } else {
        const errorMessage = formatErrorMessage(
          "Could not change default method",
          response
        );
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }
    },
    backLink
  );
}
