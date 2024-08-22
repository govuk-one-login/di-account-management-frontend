import { Request, Response } from "express";
import { ExpressRouteFunc, User } from "../../types";
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
  INTENT_ADD_MFA_METHOD,
  INTENT_CHANGE_DEFAULT_METHOD,
  INTENT_CHANGE_PHONE_NUMBER,
} from "../check-your-email/types";
import { logger } from "../../utils/logger";
import { updateMfaMethod } from "../../utils/mfa";

const TEMPLATE_NAME = "check-your-phone/index.njk";

export function checkYourPhoneGet(req: Request, res: Response): void {
  res.render(TEMPLATE_NAME, {
    phoneNumber: getLastNDigits(req.session.user.newPhoneNumber, 4),
    resendCodeLink: `${PATH_DATA.RESEND_PHONE_CODE.url}?intent=${req.query.intent}`,
    changePhoneNumberLink: PATH_DATA.CHANGE_PHONE_NUMBER.url,
    intent: req.query.intent,
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
    const sessionDetails = await generateSessionDetails(req, res);
    let isPhoneNumberUpdated = false;

    if (supportChangeMfa()) {
      isPhoneNumberUpdated = await handleMfaChange(
        intent,
        newPhoneNumber,
        updateInput,
        sessionDetails,
        req,
        service,
        res.locals.trace
      );
    } else {
      isPhoneNumberUpdated = await service.updatePhoneNumber(
        { ...updateInput, updatedValue: newPhoneNumber },
        sessionDetails
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

async function handleMfaChange(
  intent: Intent,
  newPhoneNumber: string,
  updateInput: UpdateInformationInput,
  sessionDetails: any,
  req: Request,
  service: CheckYourPhoneServiceInterface,
  trace: string
): Promise<boolean> {
  if (intent === INTENT_CHANGE_PHONE_NUMBER) {
    return handleChangePhoneNumber(
      newPhoneNumber,
      updateInput,
      sessionDetails,
      req,
      service,
      trace
    );
  } else if (intent === INTENT_ADD_MFA_METHOD) {
    return handleAddMfaMethod(
      newPhoneNumber,
      updateInput,
      sessionDetails,
      req,
      service,
      trace
    );
  } else if (intent === INTENT_CHANGE_DEFAULT_METHOD) {
    return handleChangeDefaultMethod(newPhoneNumber, sessionDetails, req);
  } else {
    logger.error({ err: `Unknown phone verification intent ${intent}`, trace });
  }
}

async function handleChangeDefaultMethod(
  newPhoneNumber: string,
  sessionDetails: any,
  req: Request
): Promise<boolean> {
  const updateInput: UpdateInformationInput = {
    updateInput: "",
    email: req.session.user.email,
    otp: "",
    mfaMethod: {
      method: {
        mfaMethodType: "SMS",
        endPoint: newPhoneNumber,
      },
      priorityIdentifier: "DEFAULT",
      methodVerified: true,
    },
  };
  await updateMfaMethod(updateInput, sessionDetails);

  return true;
}

async function handleChangePhoneNumber(
  newPhoneNumber: string,
  updateInput: UpdateInformationInput,
  sessionDetails: any,
  req: Request,
  service: CheckYourPhoneServiceInterface,
  trace: string
): Promise<boolean> {
  const smsMFAMethod = req.session.mfaMethods.find(
    (mfa) => mfa.method.mfaMethodType === "SMS"
  );
  if (smsMFAMethod) {
    smsMFAMethod.method.endPoint = newPhoneNumber;
    updateInput.mfaMethod = smsMFAMethod;
    return await service.updatePhoneNumberWithMfaApi(
      updateInput,
      sessionDetails
    );
  } else {
    logger.error({
      err: "No existing MFA method in handleChangePhoneNumber",
      trace,
    });
  }
}

async function handleAddMfaMethod(
  newPhoneNumber: string,
  updateInput: UpdateInformationInput,
  sessionDetails: any,
  req: Request,
  service: CheckYourPhoneServiceInterface,
  trace: string
): Promise<boolean> {
  const smsMFAMethod = req.session.mfaMethods.find(
    (mfa) => mfa.priorityIdentifier === "DEFAULT"
  );
  if (!smsMFAMethod) {
    logger.error({
      err: "No existing DEFAULT MFA method in handleAddMfaMethod",
      trace,
    });
    return false;
  }
  try {
    smsMFAMethod.method.endPoint = newPhoneNumber;
    updateInput.credential = "no-credentials";
    updateInput.mfaMethod = {
      ...smsMFAMethod,
      mfaIdentifier: smsMFAMethod.mfaIdentifier + 1,
      priorityIdentifier: "BACKUP",
      method: {
        mfaMethodType:
          smsMFAMethod.method.mfaMethodType === "SMS" ? "AUTH_APP" : "SMS",
        endPoint: newPhoneNumber,
      },
      methodVerified: true,
    };
    return await service.addMfaMethodService(updateInput, sessionDetails);
  } catch (error) {
    logger.error({
      err: `No existing MFA method in handleAddMfaMethod: ${error.message} `,
      trace,
    });
  }
  return false;
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
  if (intent === INTENT_ADD_MFA_METHOD) {
    return PATH_DATA.ADD_MFA_METHOD_SMS_CONFIRMATION.url;
  }
  if (intent === INTENT_CHANGE_PHONE_NUMBER) {
    return PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url;
  }
  if (intent === INTENT_CHANGE_DEFAULT_METHOD) {
    return PATH_DATA.CHANGE_DEFAULT_METHOD_CONFIRMATION.url;
  }
  logger.error({
    err: `Unknown intent in getRedirectUrl: ${intent}`,
  });
  throw Error(`Uknown intent ${intent}`);
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
