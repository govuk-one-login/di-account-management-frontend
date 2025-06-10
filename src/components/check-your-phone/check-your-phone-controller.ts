import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { PATH_DATA } from "../../app.constants";
import { CheckYourPhoneServiceInterface } from "./types";
import {
  EventType,
  getNextState,
  UserJourney,
} from "../../utils/state-machine";
import { checkYourPhoneService } from "./check-your-phone-service";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import { getLastNDigits } from "../../utils/phone-number";
import { UpdateInformationInput } from "../../utils/types";
import { supportChangeMfa, supportMfaManagement } from "../../config";
import {
  Intent,
  INTENT_ADD_BACKUP,
  INTENT_CHANGE_DEFAULT_METHOD,
  INTENT_CHANGE_PHONE_NUMBER,
} from "../check-your-email/types";
import { logger } from "../../utils/logger";
import {
  createMfaClient,
  formatErrorMessage,
  ERROR_CODES,
} from "../../utils/mfaClient";
import {
  ApiResponse,
  MfaClientInterface,
  MfaMethod,
  mfaMethodTypes,
  mfaPriorityIdentifiers,
} from "../../utils/mfaClient/types";
import { containsNumbersOnly } from "../../utils/strings";
import { getRequestConfigFromExpress } from "../../utils/http";
import {
  MFA_COMMON_OPL_SETTINGS,
  OplSettings,
  setOplSettings,
} from "../../utils/opl";

const TEMPLATE_NAME = "check-your-phone/index.njk";

const getRenderOptions = (req: Request, intent: Intent) => {
  const INTENT_TO_BACKLINK_MAP: Record<string, string> = {
    [INTENT_CHANGE_PHONE_NUMBER]: PATH_DATA.CHANGE_PHONE_NUMBER.url,
    [INTENT_ADD_BACKUP]: PATH_DATA.ADD_MFA_METHOD_SMS.url,
    [INTENT_CHANGE_DEFAULT_METHOD]: PATH_DATA.CHANGE_DEFAULT_METHOD_SMS.url,
  };

  const INTENT_TO_USE_DIFFERENT_PHONE_NUMBER_LINK_MAP: Record<string, string> =
    {
      [INTENT_CHANGE_PHONE_NUMBER]: PATH_DATA.CHANGE_PHONE_NUMBER.url,
      [INTENT_ADD_BACKUP]: PATH_DATA.ADD_MFA_METHOD_SMS.url,
      [INTENT_CHANGE_DEFAULT_METHOD]: PATH_DATA.CHANGE_DEFAULT_METHOD_SMS.url,
    };
  const useDifferentPhoneNumberLink =
    INTENT_TO_USE_DIFFERENT_PHONE_NUMBER_LINK_MAP[intent];

  if (!useDifferentPhoneNumberLink) {
    throw new Error(
      "Intent does not map to a 'use a different phone number' link"
    );
  }

  return {
    phoneNumber: getLastNDigits(req.session.user.newPhoneNumber, 4),
    resendCodeLink: `${PATH_DATA.RESEND_PHONE_CODE.url}?intent=${intent}`,
    useDifferentPhoneNumberLink,
    intent,
    backLink: INTENT_TO_BACKLINK_MAP[intent],
  };
};

const OPL_VALUES: Record<string, Partial<OplSettings>> = {
  [`${INTENT_ADD_BACKUP}_${mfaPriorityIdentifiers.default}_${mfaMethodTypes.sms}`]:
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "8d348159-08ab-4e27-96ea-843ec64e953f",
    },

  [`${INTENT_CHANGE_PHONE_NUMBER}_${mfaPriorityIdentifiers.default}_${mfaMethodTypes.sms}`]:
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "c9a421f2-766c-49c8-8e66-42d0f41bd757",
    },
  [`${INTENT_ADD_BACKUP}_${mfaPriorityIdentifiers.default}_${mfaMethodTypes.authApp}`]:
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "a6156870-d4c7-4e1b-b72c-a84b924e4913",
    },
  [`${INTENT_CHANGE_DEFAULT_METHOD}_${mfaPriorityIdentifiers.default}_${mfaMethodTypes.authApp}`]:
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "df468804-c84b-4134-96ca-6610ffd8b6f5",
    },
};

const setCheckYourPhoneOplSettings = (
  intent: Intent,
  req: Request,
  res: Response
) => {
  if (!supportMfaManagement(req.cookies)) {
    setOplSettings(
      {
        contentId: "fb69b162-9ddb-41db-a8fa-3cca7fea2fa9",
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

export function checkYourPhoneGet(req: Request, res: Response): void {
  const intent = req.query.intent as Intent;
  setCheckYourPhoneOplSettings(intent, req, res);
  res.render(TEMPLATE_NAME, getRenderOptions(req, intent));
}

export function checkYourPhonePost(
  service: CheckYourPhoneServiceInterface = checkYourPhoneService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const intent = req.body.intent as Intent;

    setCheckYourPhoneOplSettings(intent, req, res);

    const { code } = req.body;

    if (!code) {
      const error = formatValidationError(
        "code",
        req.t("pages.checkYourPhone.code.validationError.required")
      );
      return renderBadRequest(
        res,
        req,
        TEMPLATE_NAME,
        error,
        getRenderOptions(req, intent)
      );
    }

    if (code.length > 6) {
      const error = formatValidationError(
        "code",
        req.t("pages.checkYourPhone.code.validationError.maxLength")
      );
      return renderBadRequest(
        res,
        req,
        TEMPLATE_NAME,
        error,
        getRenderOptions(req, intent)
      );
    }

    if (code.length < 6) {
      const error = formatValidationError(
        "code",
        req.t("pages.checkYourPhone.code.validationError.minLength")
      );
      return renderBadRequest(
        res,
        req,
        TEMPLATE_NAME,
        error,
        getRenderOptions(req, intent)
      );
    }

    if (!containsNumbersOnly(code)) {
      const error = formatValidationError(
        "code",
        req.t("pages.checkYourPhone.code.validationError.invalidFormat")
      );
      return renderBadRequest(
        res,
        req,
        TEMPLATE_NAME,
        error,
        getRenderOptions(req, intent)
      );
    }

    const { email, newPhoneNumber } = req.session.user;
    const updateInput: UpdateInformationInput = {
      email,
      otp: code,
    };
    let isPhoneNumberUpdated = false;
    let changePhoneNumberWithMfaApiErrorMessage: string | undefined = undefined;

    if (supportChangeMfa(req.cookies)) {
      const mfaClient = createMfaClient(req, res);
      const changePhoneNumberResult = await changePhoneNumberwithMfaApi(
        mfaClient,
        code,
        intent,
        newPhoneNumber,
        res.locals.trace,
        req.session.mfaMethods,
        req.t
      );
      isPhoneNumberUpdated = changePhoneNumberResult.success;
      if (changePhoneNumberResult.success === false) {
        changePhoneNumberWithMfaApiErrorMessage =
          changePhoneNumberResult.errorMessage;
      }
    } else {
      isPhoneNumberUpdated = await service.updatePhoneNumber(
        { ...updateInput, updatedValue: newPhoneNumber },
        getRequestConfigFromExpress(req, res)
      );
    }

    if (isPhoneNumberUpdated) {
      updateSessionUser(req, newPhoneNumber, getUserJourney(intent));
      return res.redirect(getRedirectUrl(intent));
    }

    const error = formatValidationError(
      "code",
      changePhoneNumberWithMfaApiErrorMessage ??
        req.t("pages.checkYourPhone.code.validationError.invalidCode")
    );

    renderBadRequest(
      res,
      req,
      TEMPLATE_NAME,
      error,
      getRenderOptions(req, intent)
    );
  };
}

async function changePhoneNumberwithMfaApi(
  client: MfaClientInterface,
  code: string,
  intent: Intent,
  newPhoneNumber: string,
  trace: string,
  currentMfaMethods: MfaMethod[],
  translate: Request["t"]
): Promise<
  | {
      success: true;
    }
  | {
      success: false;
      errorMessage: string;
    }
> {
  let response: ApiResponse<unknown>;

  switch (intent) {
    case INTENT_ADD_BACKUP: {
      response = await client.create(
        { mfaMethodType: "SMS", phoneNumber: newPhoneNumber },
        code
      );
      break;
    }

    case INTENT_CHANGE_PHONE_NUMBER: {
      const smsMFAMethod = currentMfaMethods.find(
        (mfa) =>
          mfa.method.mfaMethodType === "SMS" &&
          mfa.priorityIdentifier === "DEFAULT"
      );

      if (!smsMFAMethod) {
        const errorMessage =
          "Could not change phone number - no existing SMS methods found.";
        logger.error(errorMessage);
        throw new Error(errorMessage);
      }

      response = await client.update(
        {
          mfaIdentifier: smsMFAMethod.mfaIdentifier,
          method: { mfaMethodType: "SMS", phoneNumber: newPhoneNumber },
          priorityIdentifier: smsMFAMethod.priorityIdentifier,
        },
        code
      );
      break;
    }

    case INTENT_CHANGE_DEFAULT_METHOD: {
      const defaultMethod = currentMfaMethods.find(
        (mfa) => mfa.priorityIdentifier === "DEFAULT"
      );

      response = await client.update(
        {
          mfaIdentifier: defaultMethod.mfaIdentifier,
          method: { mfaMethodType: "SMS", phoneNumber: newPhoneNumber },
          priorityIdentifier: defaultMethod.priorityIdentifier,
        },
        code
      );
      break;
    }

    default: {
      const errorMessage = `Could not change phone number - unknown intent: ${intent}`;
      logger.error({ trace }, errorMessage);
      throw new Error(errorMessage);
    }
  }

  if (response?.error?.code === ERROR_CODES.INVALID_OTP_CODE) {
    return {
      success: false,
      errorMessage: translate(
        "pages.checkYourPhone.code.validationError.invalidCode"
      ),
    };
  }

  if (!response?.success) {
    const errorMessage = formatErrorMessage(
      "Could not change phone number",
      response
    );
    logger.error({ trace }, errorMessage);
    throw new Error(errorMessage);
  }

  return {
    success: response.success,
  };
}

function updateSessionUser(
  req: Request,
  newPhoneNumber: string,
  state: UserJourney = UserJourney.ChangePhoneNumber
): void {
  req.session.user.phoneNumber = newPhoneNumber;
  delete req.session.user.newPhoneNumber;
  req.session.user.state[state] = getNextState(
    req.session.user.state[state].value,
    EventType.ValueUpdated
  );
}

function getRedirectUrl(intent: Intent): string {
  if (intent === INTENT_ADD_BACKUP) {
    return PATH_DATA.ADD_MFA_METHOD_SMS_CONFIRMATION.url;
  }
  if (intent === INTENT_CHANGE_DEFAULT_METHOD) {
    return PATH_DATA.CHANGE_DEFAULT_METHOD_CONFIRMATION.url;
  }
  return PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url;
}

function getUserJourney(intent: Intent): UserJourney {
  if (intent === "changeDefaultMethod") {
    return UserJourney.ChangeDefaultMethod;
  }
  return UserJourney.ChangePhoneNumber;
}

export function requestNewOTPCodeGet(req: Request, res: Response): void {
  req.session.user.state.changePhoneNumber = getNextState(
    req.session.user.state.changePhoneNumber.value,
    EventType.ResendCode
  );
  return res.redirect(PATH_DATA.CHANGE_PHONE_NUMBER.url);
}
