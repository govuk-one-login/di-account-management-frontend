import { NextFunction, Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";
import { ExpressRouteFunc } from "../../types";
import { ChangeAuthenticatorAppServiceInterface } from "./types";
import { changeAuthenticatorAppService } from "./change-authenticator-app-service";
import { getNextState } from "../../utils/state-machine";
import { formatValidationError } from "../../utils/validation";
import xss from "xss";
import { getTxmaHeader } from "../../utils/txma-header";
import {
  generateMfaSecret,
  generateQRCodeValue,
  verifyMfaCode,
} from "../../utils/mfa";
import assert from "node:assert";
import QRCode from "qrcode";
import { splitSecretKeyIntoFragments } from "../../utils/strings";
import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../../utils/types";
import { MfaMethod } from "../../utils/mfa/types";

const CHANGE_AUTHENTICATOR_APP_TEMPLATE = "change-authenticator-app/index.njk";

async function renderUpdateAuthAppPage(
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

    return res.render(CHANGE_AUTHENTICATOR_APP_TEMPLATE, {
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

export async function changeAuthenticatorAppGet(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  return renderUpdateAuthAppPage(req, res, next, {});
}

export function changeAuthenticatorAppPost(
  service: ChangeAuthenticatorAppServiceInterface = changeAuthenticatorAppService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response, next: NextFunction) {
    const { code, authAppSecret } = req.body;

    assert(authAppSecret, "authAppSecret not set in body");

    if (code.length !== 6) {
      return renderUpdateAuthAppPage(
        req,
        res,
        next,
        formatValidationError(
          "code",
          req.t("pages.renderUpdateAuthAppPage.errors.maxLength")
        )
      );
    }

    const isValid = verifyMfaCode(authAppSecret, code);

    if (!isValid) {
      return renderUpdateAuthAppPage(
        req,
        res,
        next,
        formatValidationError(
          "code",
          req.t("pages.changeAuthenticatorApp.errors.invalidCode")
        )
      );
    }

    const { email } = req.session.user;

    const updateInput: UpdateInformationInput = {
      email,
      updatedValue: authAppSecret,
      otp: code,
    };

    const sessionDetails: UpdateInformationSessionValues = {
      accessToken: req.session.user.tokens.accessToken,
      sourceIp: req.ip,
      sessionId: res.locals.sessionId,
      persistentSessionId: res.locals.persistentSessionId,
      userLanguage: xss(req.cookies.lng as string),
      clientSessionId: res.locals.clientSessionId,
      txmaAuditEncoded: getTxmaHeader(req, res.locals.trace),
    };

    let isAuthenticatorAppUpdated = false;
    const authAppMFAMethod: MfaMethod = req.session.mfaMethods.find(
      (mfa) => mfa.mfaMethodType === "AUTH_APP"
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

      req.session.user.state.changeAuthenticatorApp = getNextState(
        req.session.user.state.changeAuthenticatorApp.value,
        "VALUE_UPDATED"
      );

      return res.redirect(PATH_DATA.AUTHENTICATOR_APP_UPDATED_CONFIRMATION.url);
    }
  };
}
