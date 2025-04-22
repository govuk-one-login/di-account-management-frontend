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
import { supportChangeMfa } from "../../config";
import { generateSessionDetails } from "../common/mfa";
import {
  Intent,
  INTENT_ADD_BACKUP,
  INTENT_CHANGE_DEFAULT_METHOD,
  INTENT_CHANGE_PHONE_NUMBER,
} from "../check-your-email/types";
import { logger } from "../../utils/logger";
import { createMfaClient, formatErrorMessage } from "../../utils/mfaClient";

const TEMPLATE_NAME = "check-your-phone/index.njk";
const INTENT_TO_BACKLINK_MAP: Record<string, string> = {
  [INTENT_CHANGE_PHONE_NUMBER]: PATH_DATA.CHANGE_PHONE_NUMBER.url,
  [INTENT_ADD_BACKUP]: PATH_DATA.ADD_MFA_METHOD_SMS.url,
  [INTENT_CHANGE_DEFAULT_METHOD]: PATH_DATA.CHANGE_DEFAULT_METHOD.url,
};

export function checkYourPhoneGet(req: Request, res: Response): void {
  const intent = req.query.intent as string;
  const backLink = INTENT_TO_BACKLINK_MAP[intent] ?? undefined;

  res.render(TEMPLATE_NAME, {
    phoneNumber: getLastNDigits(req.session.user.newPhoneNumber, 4),
    resendCodeLink: `${PATH_DATA.RESEND_PHONE_CODE.url}?intent=${req.query.intent}`,
    changePhoneNumberLink: PATH_DATA.CHANGE_PHONE_NUMBER.url,
    intent: intent,
    backLink: backLink,
  });
}

export function checkYourPhonePost(
  service: CheckYourPhoneServiceInterface = checkYourPhoneService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email, newPhoneNumber } = req.session.user;
    const intent = req.body.intent as Intent;
    const updateInput: UpdateInformationInput = {
      email,
      otp: req.body["code"],
    };
    let isPhoneNumberUpdated = false;

    if (supportChangeMfa()) {
      const mfaClient = createMfaClient(req, res);
      if (intent === INTENT_ADD_BACKUP) {
        const response = await mfaClient.create(
          { mfaMethodType: "SMS", phoneNumber: newPhoneNumber },
          req.body.code
        );

        if (!response.success) {
          logger.error(
            { trace: res.locals.trace },
            formatErrorMessage("Failed to create SMS MFA", response)
          );
        }
        isPhoneNumberUpdated = response.success;
      } else if (intent === INTENT_CHANGE_PHONE_NUMBER) {
        const smsMFAMethod = req.session.mfaMethods.find(
          (mfa) => mfa.method.mfaMethodType === "SMS"
        );

        if (!smsMFAMethod) {
          const errorMessage =
            "Could not change phone number - no existing SMS methods found.";
          logger.error(errorMessage);
          throw new Error(errorMessage);
        }

        const response = await mfaClient.update(
          {
            mfaIdentifier: smsMFAMethod.mfaIdentifier,
            method: { mfaMethodType: "SMS", phoneNumber: newPhoneNumber },
            priorityIdentifier: smsMFAMethod.priorityIdentifier,
            methodVerified: smsMFAMethod.methodVerified,
          },
          req.body["code"]
        );

        if (!response.success) {
          logger.error(
            { trace: res.locals.trace },
            formatErrorMessage("Failed to create SMS MFA", response)
          );
        }
        isPhoneNumberUpdated = response.success;
      } else if (intent == INTENT_CHANGE_DEFAULT_METHOD) {
        const defaultMethod = req.session.mfaMethods.find(
          (mfa) => mfa.priorityIdentifier === "DEFAULT"
        );

        if (!defaultMethod) {
          const errorMessage =
            "Could not change phone number - no default method found.";
          logger.error(errorMessage);
          throw new Error(errorMessage);
        }

        const response = await mfaClient.update(
          {
            mfaIdentifier: defaultMethod.mfaIdentifier,
            method: { mfaMethodType: "SMS", phoneNumber: newPhoneNumber },
            priorityIdentifier: defaultMethod.priorityIdentifier,
            methodVerified: defaultMethod.methodVerified,
          },
          req.body["code"]
        );

        isPhoneNumberUpdated = response.success;

        if (!response.success) {
          logger.error(
            { trace: res.locals.trace },
            formatErrorMessage("Failed to create SMS MFA", response)
          );
        }
      } else {
        const errorMessage = `Check your phone controller: unknown phone verification intent ${intent}`;
        logger.error({ trace: res.locals.trace }, errorMessage);
        throw new Error(errorMessage);
      }
    } else {
      isPhoneNumberUpdated = await service.updatePhoneNumber(
        { ...updateInput, updatedValue: newPhoneNumber },
        await generateSessionDetails(req, res)
      );
    }

    if (isPhoneNumberUpdated) {
      updateSessionUser(req, newPhoneNumber, getUserJourney(intent));
      return res.redirect(getRedirectUrl(intent));
    }

    const error = formatValidationError(
      "code",
      req.t("pages.checkYourPhone.code.validationError.invalidCode")
    );

    renderBadRequest(res, req, TEMPLATE_NAME, error);
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
