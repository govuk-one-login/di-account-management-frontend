import { Request, Response } from "express";
import { redactPhoneNumber } from "../../utils/strings";

export function updateEmailConfirmationGet(req: Request, res: Response): void {
  delete req.session.user.state.changeEmail;

  res.render("update-confirmation/index.njk", {
    pageTitle: req.t("pages.updateEmailConfirmation.title"),
    panelText: req.t("pages.updateEmailConfirmation.panelText"),
    summaryText: req
      .t("pages.updateEmailConfirmation.summaryText")
      .replace("[email]", req.session.user.email),
  });
}

export function updatePasswordConfirmationGet(
  req: Request,
  res: Response
): void {
  delete req.session.user.state.changePassword;

  res.render("update-confirmation/index.njk", {
    pageTitle: req.t("pages.updatePasswordConfirmation.title"),
    panelText: req.t("pages.updatePasswordConfirmation.panelText"),
  });
}

export function updatePhoneNumberConfirmationGet(
  req: Request,
  res: Response
): void {
  delete req.session.user.state.changePhoneNumber;

  res.render("update-confirmation/index.njk", {
    pageTitle: req.t("pages.updatePhoneNumberConfirmation.title"),
    panelText: req.t("pages.updatePhoneNumberConfirmation.panelText"),
    summaryText: req
      .t("pages.updatePhoneNumberConfirmation.summaryText")
      .replace("[mobile]", redactPhoneNumber(req.session.user.phoneNumber)),
  });
}

export function deleteAccountConfirmationGet(
  req: Request,
  res: Response
): void {
  req.session.destroy();

  res.render("update-confirmation/index.njk", {
    pageTitle: req.t("pages.deleteAccountConfirmation.title"),
    panelText: req.t("pages.deleteAccountConfirmation.panelText"),
    summaryText: req.t("pages.deleteAccountConfirmation.summaryText"),
    showGovUKButton: true,
  });
}
