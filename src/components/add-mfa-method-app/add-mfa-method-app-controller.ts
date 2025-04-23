import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";
import { verifyMfaCode } from "../../utils/mfa";
import assert from "node:assert";
import { formatValidationError } from "../../utils/validation";
import { EventType, getNextState } from "../../utils/state-machine";
import { renderMfaMethodPage } from "../common/mfa";
import { containsNumbersOnly } from "../../utils/strings";
import { createMfaClient, formatErrorMessage } from "../../utils/mfaClient";
import { AuthAppMethod } from "src/utils/mfaClient/types";

const ADD_MFA_METHOD_AUTH_APP_TEMPLATE = "add-mfa-method-app/index.njk";

const backLink = PATH_DATA.ADD_MFA_METHOD_GO_BACK.url;

export async function addMfaMethodGoBackGet(
  req: Request,
  res: Response
): Promise<void> {
  req.session.user.state.addBackup = getNextState(
    req.session.user.state.addBackup.value,
    EventType.GoBackToChooseBackup
  );
  return res.redirect(PATH_DATA.ADD_MFA_METHOD.url);
}

export async function addMfaAppMethodGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  return renderMfaMethodPage(
    ADD_MFA_METHOD_AUTH_APP_TEMPLATE,
    req,
    res,
    next,
    undefined,
    backLink
  );
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
        ),
        backLink
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
        ),
        backLink
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
        ),
        backLink
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
        ),
        backLink
      );
    }

    const newMethod: AuthAppMethod = {
      mfaMethodType: "AUTH_APP",
      credential: authAppSecret,
    };

    const mfaClient = createMfaClient(req, res);
    const response = await mfaClient.create(newMethod);

    if (!response.success) {
      const errorMessage = formatErrorMessage(
        "Failed to add MFA method",
        response
      );
      req.log.error({ trace: res.locals.trace }, errorMessage);
      throw new Error(errorMessage);
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
