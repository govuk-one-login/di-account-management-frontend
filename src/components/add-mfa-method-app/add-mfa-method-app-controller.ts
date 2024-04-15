import { Request, Response, NextFunction } from "express";
import { HTTP_STATUS_CODES, PATH_DATA } from "../../app.constants";
import {
  addMfaMethod,
  generateMfaSecret,
  generateQRCodeValue,
  verifyMfaCode,
} from "../../utils/mfa";
import QRCode from "qrcode";
import assert from "node:assert";
import { splitSecretKeyIntoFragments } from "../../utils/strings";
import { formatValidationError } from "../../utils/validation";
import { getNextState } from "../../utils/state-machine";

async function renderMfaMethodAppPage(
  req: Request,
  res: Response,
  next: NextFunction,
  errors: ReturnType<typeof formatValidationError>
): Promise<void> {
  try {
    assert(req.session.user.email, "email not set in session");

    const authAppSecret = req.body.authAppSecret || generateMfaSecret();

    const qrCodeText = generateQRCodeValue(
      authAppSecret,
      req.session.user.email,
      "GOV.UK One Login"
    );

    const qrCode = await QRCode.toDataURL(qrCodeText);
    return res.render("add-mfa-method-app/index.njk", {
      authAppSecret,
      qrCode,
      formattedSecret: splitSecretKeyIntoFragments(authAppSecret).join(" "),
      errorList: Object.keys(errors || {}).map((key) => {
        return {
          text: errors[key].text,
          href: `#${key}`,
        };
      }),
    });
  } catch (e) {
    req.log.error(e);
    return next(e);
  }
}

export async function addMfaAppMethodGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  return renderMfaMethodAppPage(req, res, next, {});
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
      return renderMfaMethodAppPage(
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
      return renderMfaMethodAppPage(
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
      return renderMfaMethodAppPage(
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
        priorityIdentifier: "SECONDARY",
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
      "VALUE_UPDATED"
    );

    return res.redirect(PATH_DATA.ADD_MFA_METHOD_APP_CONFIRMATION.url);
  } catch (e) {
    req.log.error(e);
    return next(e);
  }
}
