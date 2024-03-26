import { Request, Response } from "express";
import { supportActivityLog } from "../../config";
import { PATH_DATA } from "../../app.constants";
import { hasAllowedRSAServices } from "../../middleware/check-allowed-services-list";
import { getLastNDigits } from "../../utils/phone-number";

export async function securityGet(req: Request, res: Response): Promise<void> {
  const { email, phoneNumber, isPhoneNumberVerified } = req.session.user;
  const phoneNumberLastFourDigits = getLastNDigits(phoneNumber, 4);

  const supportActivityLogFlag = supportActivityLog();
  const hasHmrc = await hasAllowedRSAServices(req, res);

  const activityLogUrl = PATH_DATA.SIGN_IN_HISTORY.url;

  const data = {
    email,
    phoneNumber: phoneNumberLastFourDigits,
    isPhoneNumberVerified,
    supportActivityLog: supportActivityLogFlag && hasHmrc,
    activityLogUrl,
  };

  res.render("security/index.njk", data);
}
