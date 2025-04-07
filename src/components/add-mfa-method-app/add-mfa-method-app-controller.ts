import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";
import { verifyMfaCode } from "../../utils/mfa";
import assert from "node:assert";
import { formatValidationError } from "../../utils/validation";
import { EventType, getNextState } from "../../utils/state-machine";
import { renderMfaMethodPage } from "../common/mfa";
import { containsNumbersOnly } from "../../utils/strings";
import { createMfaClient } from "../../utils/mfaClient";
import { AuthAppMethod } from "src/utils/mfaClient/types";

const ADD_MFA_METHOD_AUTH_APP_TEMPLATE = "add-mfa-method-app/index.njk";

export async function addMfaAppMethodGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  return renderMfaMethodPage(ADD_MFA_METHOD_AUTH_APP_TEMPLATE, req, res, next);
}

export async function addMfaAppMethodPost(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code, authAppSecret } = req.body;

    assert(authAppSecret, "authAppSecret not set in body");

    if (!code) {
      return renderMfaMethodPage(
        ADD_MFA_METHOD_AUTH_APP_TEMPLATE,
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
        ADD_MFA_METHOD_AUTH_APP_TEMPLATE,
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
        ADD_MFA_METHOD_AUTH_APP_TEMPLATE,
        req,
        res,
        next,
        formatValidationError(
          "code",
          req.t("pages.addBackupApp.errors.maxLength")
        )
      );
    }

    const isValid = verifyMfaCode(authAppSecret, code);

    if (!isValid) {
      return renderMfaMethodPage(
        ADD_MFA_METHOD_AUTH_APP_TEMPLATE,
        req,
        res,
        next,
        formatValidationError(
          "code",
          req.t("pages.addBackupApp.errors.invalidCode")
        )
      );
    }

    const newMethod: AuthAppMethod = {
      type: "AUTH_APP",
      credential: authAppSecret,
    };

    const mfaClient = createMfaClient(req, res);
    const response = await mfaClient.create(newMethod);

    if (!response.success) {
      throw Error(
        `Failed to add MFA method, response status: ${response.status}`
      );
    }

    req.session.user.state.addBackup = getNextState(
      req.session.user.state.addBackup.value,
      EventType.ValueUpdated
    );
    return res.redirect(PATH_DATA.ADD_MFA_METHOD_APP_CONFIRMATION.url);
  } catch (error) {
    req.log.error(error);
    return next(error);
  }
}
