import { NextFunction, Request, Response } from "express";
import {
  formatValidationError,
  generateErrorList,
} from "../../../utils/validation";
import assert from "node:assert";
import { generateMfaSecret, generateQRCodeValue } from "../../../utils/mfa";
import QRCode from "qrcode";
import { splitSecretKeyIntoFragments } from "../../../utils/strings";
import { UpdateInformationSessionValues } from "../../../utils/types";
import xss from "xss";
import { getTxmaHeader } from "../../../utils/txma-header";

export async function renderMfaMethodPage(
  templateFile: string,
  req: Request,
  res: Response,
  next: NextFunction,
  errors?: ReturnType<typeof formatValidationError>
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
    return res.render(templateFile, {
      authAppSecret,
      qrCode,
      formattedSecret: splitSecretKeyIntoFragments(authAppSecret).join(" "),
      errors,
      errorList: generateErrorList(errors),
    });
  } catch (e) {
    req.log.error(e);
    return next(e);
  }
}

export async function generateSessionDetails(
  req: any,
  res: any
): Promise<UpdateInformationSessionValues> {
  const sessionDetails: UpdateInformationSessionValues = {
    accessToken: req.session.user.tokens.accessToken,
    sourceIp: req.ip,
    sessionId: res.locals.sessionId,
    persistentSessionId: res.locals.persistentSessionId,
    userLanguage: xss(req.cookies.lng as string),
    clientSessionId: res.locals.clientSessionId,
    txmaAuditEncoded: getTxmaHeader(req, res.locals.trace),
  };
  return sessionDetails;
}
