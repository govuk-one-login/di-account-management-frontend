import { Request, Response } from "express";
import { PATH_DATA } from "../../app.constants";
import {
  convertInternationalPhoneNumberToE164Format,
  getLastNDigits,
} from "../../utils/phone-number";
import { EventType, getNextState } from "../../utils/state-machine";

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
  req.session.user.state.changePhoneNumber = getNextState(
    req.session.user.state.addMfaMethod.value,
    EventType.VerifyCodeSent
  );

  req.session.user.newPhoneNumber = req.body.hasInternationalPhoneNumber
    ? convertInternationalPhoneNumberToE164Format(
        req.body.internationalPhoneNumber
      )
    : req.body.ukPhoneNumber;

  res.redirect(`${PATH_DATA.CHECK_YOUR_PHONE.url}?intent=addMfaMethod`);
}

export async function addMfaAppMethodConfirmationGet(
  req: Request,
  res: Response
): Promise<void> {
  return res.render("common/confirmation-page/confirmation.njk", {
    pageTitleName: req.t("pages.addMfaMethodSms.confirm.title"),
    heading: req.t("pages.addMfaMethodSms.confirm.heading"),
    message: req
      .t("pages.addMfaMethodSms.confirm.message")
      .replace("[mobile]", getLastNDigits(req.session.user.phoneNumber, 4)),
    backLinkText: req.t("pages.addMfaMethodSms.confirm.backLink"),
    backLink: PATH_DATA.SECURITY.url,
  });
}
