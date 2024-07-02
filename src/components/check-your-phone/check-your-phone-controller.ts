import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { PATH_DATA } from "../../app.constants";
import { CheckYourPhoneServiceInterface } from "./types";
import { EventType, getNextState } from "../../utils/state-machine";
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
  INTENT_CHANGE_PHONE_NUMBER,
} from "../check-your-email/types";

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
        service
      );
    } else {
      isPhoneNumberUpdated = await service.updatePhoneNumber(
        { ...updateInput, updatedValue: newPhoneNumber },
        sessionDetails
      );
    }

    if (isPhoneNumberUpdated) {
      updateSessionUser(req, newPhoneNumber);
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
  service: CheckYourPhoneServiceInterface
): Promise<boolean> {
  if (intent === INTENT_CHANGE_PHONE_NUMBER) {
    return handleChangePhoneNumber(
      newPhoneNumber,
      updateInput,
      sessionDetails,
      req,
      service
    );
  } else if (intent === INTENT_ADD_MFA_METHOD) {
    return handleAddMfaMethod(
      newPhoneNumber,
      updateInput,
      sessionDetails,
      req,
      service
    );
  } else {
    // TODO: Confirm with UCD which error we should display
    throw Error(`Unknown phone verification intent ${intent}`);
  }
}

async function handleChangePhoneNumber(
  newPhoneNumber: string,
  updateInput: UpdateInformationInput,
  sessionDetails: any,
  req: Request,
  service: CheckYourPhoneServiceInterface
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
    // TODO: Confirm with UCD which error we should display
    throw Error(`No existing MFA method for: ${req.session.user.email}`);
  }
}

async function handleAddMfaMethod(
  newPhoneNumber: string,
  updateInput: UpdateInformationInput,
  sessionDetails: any,
  req: Request,
  service: CheckYourPhoneServiceInterface
): Promise<boolean> {
  const smsMFAMethod = req.session.mfaMethods.find(
    (mfa) => mfa.priorityIdentifier === "DEFAULT"
  );
  if (smsMFAMethod) {
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
  }
  return false;
}

function updateSessionUser(req: Request, newPhoneNumber: string): void {
  req.session.user.phoneNumber = newPhoneNumber;
  delete req.session.user.newPhoneNumber;
  req.session.user.state.changePhoneNumber = getNextState(
    req.session.user.state.changePhoneNumber.value,
    EventType.ValueUpdated
  );
}

function getRedirectUrl(intent: Intent): string {
  if (intent === INTENT_ADD_MFA_METHOD) {
    return PATH_DATA.ADD_MFA_METHOD_SMS_CONFIRMATION.url;
  }
  return PATH_DATA.PHONE_NUMBER_UPDATED_CONFIRMATION.url;
}

export function requestNewOTPCodeGet(req: Request, res: Response): void {
  req.session.user.state.changePhoneNumber = getNextState(
    req.session.user.state.changePhoneNumber.value,
    EventType.ResendCode
  );

  return res.redirect(PATH_DATA.CHANGE_PHONE_NUMBER.url);
}
