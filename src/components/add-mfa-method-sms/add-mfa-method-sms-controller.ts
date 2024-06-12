import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";

export async function addMfaSmsMethodGet(
  req: Request,
  res: Response
): Promise<void> {
  res.render("add-mfa-method-sms/index.njk");
}

export async function addMfaSmsMethodPost(
  req: Request,
  res: Response
): Promise<void> {
  //TODO do something with this
  res.redirect(`PATH_DATA.CHECK_YOUR_PHONE.url?intent=addMfaMethod`);
}

export async function addMfaAppMethodConfirmationGet(
  req: Request,
  res: Response
): Promise<void> {
  return res.render("common/confirmation-page/confirmation.njk", {
    pageTitleName: req.t("pages.addMfaMethodSms.confirm.title"),
    heading: req.t("pages.addMfaMethodSms.confirm.heading"),
    message: req.t("pages.addMfaMethodSms.confirm.message"),
    backLinkText: req.t("pages.addMfaMethodSms.confirm.backLink"),
    backLink: PATH_DATA.SECURITY.url,
  });
}
