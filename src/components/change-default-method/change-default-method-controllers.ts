import { NextFunction, Request, Response } from "express";
import {
  convertInternationalPhoneNumberToE164Format,
  getLastNDigits,
} from "../../utils/phone-number";
import { handleMfaMethodPage, renderMfaMethodPage } from "../common/mfa";
import { EventType, getNextState } from "../../utils/state-machine";
import { ERROR_CODES, PATH_DATA } from "../../app.constants";
import { ChangePhoneNumberServiceInterface } from "../change-phone-number/types";
import { changePhoneNumberService } from "../change-phone-number/change-phone-number-service";
import xss from "xss";
import { getTxmaHeader } from "../../utils/txma-header";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import { BadRequestError } from "../../utils/errors";
import { createMfaClient, formatErrorMessage } from "../../utils/mfaClient";
import { logger } from "../../utils/logger";

const ADD_APP_TEMPLATE = "change-default-method/change-to-app.njk";

const backLink = PATH_DATA.CHANGE_DEFAULT_METHOD.url;

export async function changeDefaultMethodGet(
  req: Request,
  res: Response
): Promise<void> {
  const defaultMethod = req.session.mfaMethods.find(
    (method) => method.priorityIdentifier === "DEFAULT"
  );

  if (!defaultMethod) {
    res.status(404);
    return;
  }

  const data = {
    currentMethodType: defaultMethod.method.mfaMethodType,
    phoneNumber:
      defaultMethod.method.mfaMethodType === "SMS"
        ? getLastNDigits(defaultMethod.method.phoneNumber, 4)
        : null,
  };

  res.render("change-default-method/index.njk", data);
}

export async function changeDefaultMethodAppGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  return renderMfaMethodPage(ADD_APP_TEMPLATE, req, res, next);
}

export async function changeDefaultMethodSmsGet(
  req: Request,
  res: Response
): Promise<void> {
  return res.render("change-default-method/change-to-sms.njk", {
    backLink,
  });
}

export function changeDefaultMethodSmsPost(
  service: ChangePhoneNumberServiceInterface = changePhoneNumberService()
) {
  return async function (req: Request, res: Response): Promise<void> {
    const {
      hasInternationalPhoneNumber,
      internationalPhoneNumber,
      phoneNumber,
    } = req.body;
    const { accessToken } = req.session.user.tokens;
    const { email } = req.session.user;
    const newPhoneNumber =
      hasInternationalPhoneNumber === "true"
        ? convertInternationalPhoneNumberToE164Format(internationalPhoneNumber)
        : phoneNumber;

    const response = await service.sendPhoneVerificationNotification(
      accessToken,
      email,
      newPhoneNumber,
      req.ip,
      res.locals.sessionId,
      res.locals.persistentSessionId,
      xss(req.cookies.lng as string),
      res.locals.clientSessionId,
      getTxmaHeader(req, res.locals.trace)
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
        req.t(
          "pages.changePhoneNumber.ukPhoneNumber.validationError.samePhoneNumber"
        )
      );
      return renderBadRequest(
        res,
        req,
        "change-default-method/change-to-sms.njk",
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
  return handleMfaMethodPage(ADD_APP_TEMPLATE, req, res, next, async () => {
    const { authAppSecret } = req.body;

    const currentDefaultMethod = req.session.mfaMethods.find(
      (mfa) => mfa.priorityIdentifier == "DEFAULT"
    );

    if (!currentDefaultMethod) {
      throw new Error(
        "Could not change default method - no current default method found"
      );
    }

    const mfaClient = createMfaClient(req, res);
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
  });
}
