import { Request, Response } from "express";
import {
  ERROR_MESSAGES,
  HTTP_STATUS_CODES,
  PATH_DATA,
} from "../../app.constants";
import { clearCookies } from "../../utils/session-store";
import { logger } from "../../utils/logger";
import { getLastNDigits } from "../../utils/phone-number";
import { setOplSettings } from "../../utils/opl";

export function updateEmailConfirmationGet(req: Request, res: Response): void {
  delete req.session.user.state.changeEmail;

  setOplSettings(
    {
      contentId: "97c85664-bc62-468a-b5a8-a4eb1ede68dc",
      taxonomyLevel2: "change email",
    },
    res
  );

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
  clearCookies(req, res, ["am"]);

  setOplSettings(
    {
      contentId: "6e223a74-7a80-4333-82b4-d44d972b3297",
      taxonomyLevel2: "change password",
    },
    res
  );

  if (req.session) {
    req.session.destroy((error) => {
      if (error) {
        logger.error(ERROR_MESSAGES.FAILED_TO_DESTROY_SESSION(error));
      }
    });
  }

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

  setOplSettings(
    {
      contentId: "8641c8eb-b695-4c31-b78d-6c901111152b",
      taxonomyLevel2: "change phone number",
    },
    res
  );

  res.render("update-confirmation/index.njk", {
    pageTitle: req.t("pages.updatePhoneNumberConfirmation.title"),
    panelText: req.t("pages.updatePhoneNumberConfirmation.panelText"),
    summaryText: req
      .t("pages.updatePhoneNumberConfirmation.summaryText")
      .replace("[mobile]", getLastNDigits(req.session.user.phoneNumber, 4)),
  });
}

export function updateAuthenticatorAppConfirmationGet(
  req: Request,
  res: Response
): void {
  delete req.session.user.state.changeAuthApp;

  res.render("update-confirmation/index.njk", {
    pageTitle: req.t("pages.updateAuthenticatorAppConfirmation.title"),
    panelText: req.t("pages.updateAuthenticatorAppConfirmation.panelText"),
    summaryText: req.t("pages.updateAuthenticatorAppConfirmation.summaryText"),
  });
}

export function deleteAccountConfirmationGet(
  req: Request,
  res: Response
): void {
  setOplSettings(
    {
      contentId: "1a4650c5-3a00-4d9b-9487-4ace9c119a1b",
      taxonomyLevel2: "delete account",
    },
    res
  );

  res.render("update-confirmation/index.njk", {
    pageTitle: req.t("pages.deleteAccountConfirmation.title"),
    panelText: req.t("pages.deleteAccountConfirmation.panelText"),
    summaryText: req.t("pages.deleteAccountConfirmation.summaryText"),
    showGovUKButton: true,
    hideAccountNavigation: true,
  });
}

export async function addMfaAppMethodConfirmationGet(
  req: Request,
  res: Response
): Promise<void> {
  return res.render("common/confirmation-page/confirmation.njk", {
    pageTitleName: req.t("pages.confirmaddBackup.title"),
    heading: req.t("pages.confirmaddBackup.heading"),
    message: req.t("pages.confirmaddBackup.message"),
    backLinkText: req.t("pages.confirmaddBackup.backLinkText"),
    backLink: PATH_DATA.SECURITY.url,
  });
}

export async function removeMfaMethodConfirmationGet(
  req: Request,
  res: Response
): Promise<void> {
  let message: string;
  const removedMethod = req.session.removedMfaMethod;

  if (!removedMethod) {
    res.redirect(PATH_DATA.SECURITY.url);
    return;
  }

  if (removedMethod?.method.mfaMethodType === "AUTH_APP") {
    message = req.t("pages.removeBackupMethod.confirm.message_app");
  }

  if (removedMethod?.method.mfaMethodType === "SMS") {
    const method = removedMethod.method;
    message = req
      .t("pages.removeBackupMethod.confirm.message_sms")
      .replace("[phoneNumber]", getLastNDigits(method.phoneNumber, 4));
  }

  delete req.session.removedMfaMethod;

  return res.render("common/confirmation-page/confirmation.njk", {
    pageTitleName: req.t("pages.removeBackupMethod.confirm.title"),
    heading: req.t("pages.removeBackupMethod.confirm.heading"),
    message: message,
    backLinkText: req.t("pages.removeBackupMethod.backLinkText"),
    backLink: PATH_DATA.SECURITY.url,
  });
}

export async function changeDefaultMfaMethodConfirmationGet(
  req: Request,
  res: Response
): Promise<void> {
  const defaultMethod = req.session.mfaMethods.find(
    (m) => m.mfaIdentifier == req.session.newDefaultMfaMethodId
  );

  if (!defaultMethod) {
    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    logger.error(
      `Update confirmation controller: unable to find MfaMethod with id ${req.session.newDefaultMfaMethodId}`
    );
    return;
  }

  const phoneNumber =
    defaultMethod.method.mfaMethodType === "SMS"
      ? getLastNDigits(defaultMethod.method.phoneNumber, 4)
      : null;

  const message = phoneNumber
    ? req
        .t("pages.switchBackupMethod.confirm.messageSms")
        .replace("[phoneNumber]", phoneNumber)
    : req.t("pages.switchBackupMethod.confirm.messageApp");

  return res.render("common/confirmation-page/confirmation.njk", {
    pageTitleName: req.t("pages.switchBackupMethod.confirm.title"),
    heading: req.t("pages.switchBackupMethod.confirm.heading"),
    message: message,
    backLinkText: req.t("pages.switchBackupMethod.confirm.backLinkText"),
    backLink: PATH_DATA.SECURITY.url,
  });
}

export async function changeDefaultMethodConfirmationGet(
  req: Request,
  res: Response
): Promise<void> {
  const defaultMethod = req.session.mfaMethods.find(
    (m) => m.priorityIdentifier === "DEFAULT"
  );

  if (!defaultMethod) {
    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    return;
  }

  const message =
    defaultMethod.method.mfaMethodType === "AUTH_APP"
      ? req.t("pages.changeDefaultMethod.confirmation.app")
      : req
          .t("pages.changeDefaultMethod.confirmation.sms")
          .replace(
            "[phoneNumber]",
            getLastNDigits(defaultMethod.method.phoneNumber, 4)
          );

  return res.render("common/confirmation-page/confirmation.njk", {
    pageTitleName: req.t("pages.changeDefaultMethod.confirmation.title"),
    heading: req.t("pages.changeDefaultMethod.confirmation.heading"),
    message,
    backLinkText: req.t("pages.changeDefaultMethod.confirmation.back"),
    backLink: PATH_DATA.SECURITY.url,
  });
}
