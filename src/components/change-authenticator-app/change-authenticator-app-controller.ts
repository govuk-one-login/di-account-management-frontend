import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { EventType, getNextState } from "../../utils/state-machine";
import { formatValidationError } from "../../utils/validation";
import { verifyMfaCode } from "../../utils/mfa";
import assert from "node:assert";
import { MfaMethod } from "../../utils/mfaClient/types";
import { containsNumbersOnly } from "../../utils/strings";
import { createMfaClient, formatErrorMessage } from "../../utils/mfaClient";
import { logger } from "../../utils/logger";
import { renderMfaMethodPage } from "../common/mfa";

const CHANGE_AUTHENTICATOR_APP_TEMPLATE = "change-authenticator-app/index.njk";

export async function changeAuthenticatorAppGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  return renderMfaMethodPage(CHANGE_AUTHENTICATOR_APP_TEMPLATE, req, res, next);
}

export function changeAuthenticatorAppPost(): ExpressRouteFunc {
  return async function (req: Request, res: Response, next: NextFunction) {
    const { code, authAppSecret } = req.body;

    assert(authAppSecret, "authAppSecret not set in body");

    if (!code) {
      return renderMfaMethodPage(
        CHANGE_AUTHENTICATOR_APP_TEMPLATE,
        req,
        res,
        next,
        formatValidationError(
          "code",
          req.t("pages.addBackupApp.errors.required")
        )
      );
    }

    if (!containsNumbersOnly(code)) {
      return renderMfaMethodPage(
        CHANGE_AUTHENTICATOR_APP_TEMPLATE,
        req,
        res,
        next,
        formatValidationError(
          "code",
          req.t("pages.addBackupApp.errors.invalidFormat")
        )
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
          req.t("pages.addBackupApp.errors.maxLength")
        )
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
          req.t("pages.addBackupApp.errors.invalidCode")
        )
      );
    }

    const authAppMFAMethod: MfaMethod = req.session.mfaMethods.find(
      (mfa) => mfa.method.mfaMethodType === "AUTH_APP"
    );

    if (!authAppMFAMethod) {
      const errorMessage =
        "Could not change authenticator app - no existing auth app method found";
      logger.error(errorMessage, { trace: res.locals.trace });
      throw new Error(errorMessage);
    }

    const mfaClient = createMfaClient(req, res);
    const response = await mfaClient.update({
      mfaIdentifier: authAppMFAMethod.mfaIdentifier,
      priorityIdentifier: authAppMFAMethod.priorityIdentifier,
      method: {
        mfaMethodType: "AUTH_APP",
        credential: authAppSecret,
      },
    });

    if (!response.success) {
      const errorMessage = formatErrorMessage(
        "Could not change authenticator app",
        response
      );
      logger.error(errorMessage, { trace: res.locals.trace });
      throw new Error(errorMessage);
    }

    req.session.user.authAppSecret = authAppSecret;

    req.session.user.state.changeAuthApp = getNextState(
      req.session.user.state.changeAuthApp.value,
      EventType.ValueUpdated
    );

    return res.redirect(PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url);
  };
}
