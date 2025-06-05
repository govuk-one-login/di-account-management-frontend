import { NextFunction, Request, Response } from "express";
import {
  formatValidationError,
  generateErrorList,
} from "../../../utils/validation";
import assert from "node:assert";
import {
  generateMfaSecret,
  generateQRCodeValue,
  verifyMfaCode,
} from "../../../utils/mfa";
import QRCode from "qrcode";
import {
  containsNumbersOnly,
  splitSecretKeyIntoFragments,
} from "../../../utils/strings";

interface OplValues {
  contentId: string;
  taxonomyLevel2?: string;
  taxonomyLevel3?: string;
}

export async function renderMfaMethodPage(
  templateFile: string,
  req: Request,
  res: Response,
  next: NextFunction,
  errors?: ReturnType<typeof formatValidationError>,
  backLink?: string,
  oplValues?: OplValues
): Promise<void> {
  try {
    assert(req.session.user.email, "email not set in session");

    const authAppSecret = req.body?.authAppSecret ?? generateMfaSecret();

    const qrCodeText = generateQRCodeValue(
      authAppSecret,
      req.session.user.email,
      "GOV.UK One Login"
    );

    const qrCode = await QRCode.toDataURL(qrCodeText);
    return res.render(templateFile, {
      authAppSecret,
      qrCode,
      formattedSecret: splitSecretKeyIntoFragments(authAppSecret).join(" "),
      backLink,
      errors,
      errorList: generateErrorList(errors),
      oplValues,
    });
  } catch (error) {
    req.log.error(error);
    return next(error);
  }
}

export async function handleMfaMethodPage(
  templateFile: string,
  req: Request,
  res: Response,
  next: NextFunction,
  onSuccess: () => any,
  backLink?: string,
  oplValues?: OplValues
): Promise<void> {
  const { code, authAppSecret } = req.body;

  assert(authAppSecret, "authAppSecret not set in body");

  if (!code) {
    return renderMfaMethodPage(
      templateFile,
      req,
      res,
      next,
      formatValidationError("code", req.t("setUpAuthApp.errors.required")),
      backLink,
      oplValues
    );
  }

  if (!containsNumbersOnly(code)) {
    return renderMfaMethodPage(
      templateFile,
      req,
      res,
      next,
      formatValidationError("code", req.t("setUpAuthApp.errors.invalidFormat")),
      backLink,
      oplValues
    );
  }

  if (code.length !== 6) {
    return renderMfaMethodPage(
      templateFile,
      req,
      res,
      next,
      formatValidationError("code", req.t("setUpAuthApp.errors.maxLength")),
      backLink,
      oplValues
    );
  }

  const isValid = verifyMfaCode(authAppSecret, code);

  if (!isValid) {
    return renderMfaMethodPage(
      templateFile,
      req,
      res,
      next,
      formatValidationError("code", req.t("setUpAuthApp.errors.invalidCode")),
      backLink,
      oplValues
    );
  }

  return onSuccess();
}
