import { Request, Response } from "express";
import { redactPhoneNumber } from "../../utils/strings";

const oplValues = {
  updateEmailConfirmation: {
    contentId: "97c85664-bc62-468a-b5a8-a4eb1ede68dc",
    taxonomyLevel2: "change email",
  },
  updatePasswordConfirmation: {
    contentId: "6e223a74-7a80-4333-82b4-d44d972b3297",
    taxonomyLevel2: "change password",
  },
  updatePhoneNumberConfirmation: {
    contentId: "8641c8eb-b695-4c31-b78d-6c901111152b",
    taxonomyLevel2: "change phone number",
  },
  deleteAccountConfirmation: {
    contentId: "1a4650c5-3a00-4d9b-9487-4ace9c119a1b",
    taxonomyLevel2: "delete account",
  },
};

export function updateEmailConfirmationGet(req: Request, res: Response): void {
  delete req.session.user.state.changeEmail;

  res.render("update-confirmation/index.njk", {
    contentId: oplValues.updateEmailConfirmation.contentId,
    taxonomyLevel2: oplValues.updateEmailConfirmation.taxonomyLevel2,
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
    contentId: oplValues.updatePasswordConfirmation.contentId,
    taxonomyLevel2: oplValues.updatePasswordConfirmation.taxonomyLevel2,
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
    contentId: oplValues.updatePhoneNumberConfirmation.contentId,
    taxonomyLevel2: oplValues.updatePhoneNumberConfirmation.taxonomyLevel2,
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
  res.render("update-confirmation/index.njk", {
    contentId: oplValues.deleteAccountConfirmation.contentId,
    taxonomyLevel2: oplValues.deleteAccountConfirmation.taxonomyLevel2,
    pageTitle: req.t("pages.deleteAccountConfirmation.title"),
    panelText: req.t("pages.deleteAccountConfirmation.panelText"),
    summaryText: req.t("pages.deleteAccountConfirmation.summaryText"),
    showGovUKButton: true,
    hideAccountNavigation: true,
  });
}
