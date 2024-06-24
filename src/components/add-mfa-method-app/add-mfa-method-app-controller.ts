import { NextFunction, Request, Response } from "express";
import { HTTP_STATUS_CODES, PATH_DATA } from "../../app.constants";
import { addMfaMethod, verifyMfaCode } from "../../utils/mfa";
import assert from "node:assert";
import { formatValidationError } from "../../utils/validation";
import { EventType, getNextState } from "../../utils/state-machine";
import { renderMfaMethodPage } from "../common/mfa";

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
          req.t("pages.addMfaMethodApp.errors.required")
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
          req.t("pages.addMfaMethodApp.errors.maxLength")
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
          req.t("pages.addMfaMethodApp.errors.invalidCode")
        )
      );
    }

    const { status } = await addMfaMethod({
      email: req.session.user.email,
      otp: code,
      credential: authAppSecret,
      mfaMethod: {
        priorityIdentifier: "BACKUP",
        mfaMethodType: "AUTH_APP",
      },
      accessToken: req.session.user.tokens.accessToken,
      sourceIp: req.ip,
      sessionId: req.session.id,
      persistentSessionId: res.locals.persistentSessionId,
    });

    if (status !== HTTP_STATUS_CODES.OK) {
      throw Error(`Failed to add MFA method, response status: ${status}`);
    }

    req.session.user.state.addMfaMethod = getNextState(
      req.session.user.state.addMfaMethod.value,
      EventType.ValueUpdated
    );
    return res.redirect(PATH_DATA.ADD_MFA_METHOD_APP_CONFIRMATION.url);
  } catch (e) {
    req.log.error(e);
    return next(e);
  }
}
