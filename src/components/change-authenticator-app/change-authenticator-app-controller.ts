import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ChangeAuthenticatorAppServiceInterface } from "./types";
import { changeAuthenticatorAppService } from "./change-authenticator-app-service";
import { EventType, getNextState } from "../../utils/state-machine";
import { formatValidationError } from "../../utils/validation";
import { verifyMfaCode } from "../../utils/mfa";
import assert from "node:assert";
import { MfaMethod } from "../../utils/mfa/types";
import { generateSessionDetails, renderMfaMethodPage } from "../common/mfa";
import { UpdateInformationInput } from "../../utils/types";
import { containsNumbersOnly } from "../../utils/strings";

const CHANGE_AUTHENTICATOR_APP_TEMPLATE = "change-authenticator-app/index.njk";

const backLink = `${PATH_DATA.ENTER_PASSWORD.url}?type=changeAuthApp`;

export async function changeAuthenticatorAppGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  return renderMfaMethodPage(
    CHANGE_AUTHENTICATOR_APP_TEMPLATE,
    req,
    res,
    next,
    undefined,
    backLink
  );
}

export function changeAuthenticatorAppPost(
  service: ChangeAuthenticatorAppServiceInterface = changeAuthenticatorAppService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response, next: NextFunction) {
    const { code, authAppSecret } = req.body;

    assert(authAppSecret, "authAppSecret not set in body");

    if (!containsNumbersOnly(code)) {
      return renderMfaMethodPage(
        CHANGE_AUTHENTICATOR_APP_TEMPLATE,
        req,
        res,
        next,
        formatValidationError(
          "code",
          req.t("pages.addMfaMethodApp.errors.invalidFormat")
        ),
        backLink
      );
    }

    if (code.length !== 6) {
      return renderMfaMethodPage(
        CHANGE_AUTHENTICATOR_APP_TEMPLATE,
        req,
        res,
        next,
        formatValidationError(
          "code",
          req.t("pages.addMfaMethodApp.errors.maxLength")
        ),
        backLink
      );
    }

    if (!verifyMfaCode(authAppSecret, code)) {
      return renderMfaMethodPage(
        CHANGE_AUTHENTICATOR_APP_TEMPLATE,
        req,
        res,
        next,
        formatValidationError(
          "code",
          req.t("pages.addMfaMethodApp.errors.invalidCode")
        ),
        backLink
      );
    }

    const { email } = req.session.user;

    const updateInput: UpdateInformationInput = {
      email,
      updatedValue: authAppSecret,
      otp: code,
    };

    const sessionDetails = await generateSessionDetails(req, res);
    let isAuthenticatorAppUpdated = false;
    const authAppMFAMethod: MfaMethod = req.session.mfaMethods.find(
      (mfa) => mfa.method.mfaMethodType === "AUTH_APP"
    );
    if (authAppMFAMethod) {
      updateInput.mfaMethod = authAppMFAMethod;
      isAuthenticatorAppUpdated = await service.updateAuthenticatorApp(
        updateInput,
        sessionDetails
      );
    } else {
      throw Error(`No existing MFA method for: ${email}`);
    }

    if (isAuthenticatorAppUpdated) {
      req.session.user.authAppSecret = authAppSecret;

      req.session.user.state.changeAuthApp = getNextState(
        req.session.user.state.changeAuthApp.value,
        EventType.ValueUpdated
      );

      return res.redirect(PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url);
    }
  };
}
