import { Request, Response, NextFunction } from "express";
import { MFA_METHODS, PATH_DATA } from "../../app.constants";
import {
  generateMfaSecret,
  generateQRCodeValue,
  verifyMfaCode,
} from "../../utils/mfa";
import QRCode from "qrcode";
import assert from "node:assert";
import { splitSecretKeyIntoFragments } from "../../utils/strings";

type MfaMethods = keyof typeof MFA_METHODS;

export function addMfaMethodGet(req: Request, res: Response): void {
  const helpText = `<p>${req.t("pages.addMfaMethod.app.help.text1")}</p><p>${req.t("pages.addMfaMethod.app.help.text2")}</p>`;

  const mfaMethods = Object.keys(MFA_METHODS).map((key, index) => {
    const method = MFA_METHODS[key as MfaMethods];
    return {
      value: method.type,
      text: req.t(`pages.addMfaMethod.${method.type}.title`),
      hint: {
        text: req.t(`pages.addMfaMethod.${method.type}.hint`),
      },
      checked: index === 0,
    };
  });
  res.render(`add-mfa-method/index.njk`, { helpText, mfaMethods });
}

export function addMfaMethodPost(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const { addMfaMethod } = req.body;

  const method = Object.keys(MFA_METHODS).find((key: MfaMethods) => {
    return MFA_METHODS[key].type === addMfaMethod;
  });

  if (!method) {
    req.log.error(`unknown addMfaMethod: ${addMfaMethod}`);
    return next(new Error(`Unknown addMfaMethod: ${addMfaMethod}`));
  }

  res.redirect(MFA_METHODS[method as MfaMethods].path.url);
  res.end();
}

async function renderMfaMethodAppPage(
  req: Request,
  res: Response,
  next: NextFunction,
  errors: any
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
    return res.render("add-mfa-method/add-app.njk", {
      authAppSecret,
      qrCode,
      formattedSecret: splitSecretKeyIntoFragments(authAppSecret).join(" "),
      errors: errors || {},
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
    const isValid = verifyMfaCode(authAppSecret, code);

    if (!isValid) {
      return renderMfaMethodAppPage(req, res, next, {
        code: { text: "Invalid code" },
      });
    }

    return res.render("common/confirmation-page/confirmation.njk", {
      heading: req.t("pages.confirmAddMfaMethod.heading"),
      message: req.t("pages.confirmAddMfaMethod.message"),
      backLinkText: req.t("pages.confirmAddMfaMethod.backLinkText"),
      backLink: PATH_DATA.SECURITY.url,
    });

    res.send({ isValid });
  } catch (e) {
    req.log.error(e);
    return next(e);
  }
}
