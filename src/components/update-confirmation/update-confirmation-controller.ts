import { Request, Response } from "express";
import {
  ERROR_MESSAGES,
  HTTP_STATUS_CODES,
  PATH_DATA,
} from "../../app.constants";
import { clearCookies } from "../../utils/session-store";
import { logger } from "../../utils/logger";
import { getLastNDigits } from "../../utils/phone-number";
import {
  MFA_COMMON_OPL_SETTINGS,
  OplSettingsLookupObject,
  CHANGE_EMAIL_COMMON_OPL_SETTINGS,
  CHANGE_PASSWORD_COMMON_OPL_SETTINGS,
  PRE_MFA_CHANGE_PHONE_NUMBER_COMMON_OPL_SETTINGS,
  DELETE_ACCOUNT_COMMON_OPL_SETTINGS,
  setOplSettings,
} from "../../utils/opl";
import { supportMfaManagement } from "../../config";
import {
  mfaMethodTypes,
  mfaPriorityIdentifiers,
} from "../../utils/mfaClient/types";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export function updateEmailConfirmationGet(req: Request, res: Response): void {
  req.metrics?.addMetric("updateEmailConfirmationGet", MetricUnit.Count, 1);
  setOplSettings(
    {
      ...CHANGE_EMAIL_COMMON_OPL_SETTINGS,
      contentId: "97c85664-bc62-468a-b5a8-a4eb1ede68dc",
    },
    res
  );

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
  req.metrics?.addMetric("updatePasswordConfirmationGet", MetricUnit.Count, 1);
  setOplSettings(
    {
      ...CHANGE_PASSWORD_COMMON_OPL_SETTINGS,
      contentId: "6e223a74-7a80-4333-82b4-d44d972b3297",
    },
    res
  );

  delete req.session.user.state.changePassword;
  clearCookies(req, res, ["am"]);

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
  req.metrics?.addMetric(
    "updatePhoneNumberConfirmationGet",
    MetricUnit.Count,
    1
  );
  setOplSettings(
    supportMfaManagement(req.cookies)
      ? {
          ...MFA_COMMON_OPL_SETTINGS,
          contentId: "670a63e1-94a5-4bec-9a5c-af36bd894ef6",
        }
      : {
          ...PRE_MFA_CHANGE_PHONE_NUMBER_COMMON_OPL_SETTINGS,
          contentId: "8641c8eb-b695-4c31-b78d-6c901111152b",
        },
    res
  );

  delete req.session.user.state.changePhoneNumber;

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
  req.metrics?.addMetric(
    "updateAuthenticatorAppConfirmationGet",
    MetricUnit.Count,
    1
  );
  setOplSettings(
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "b60b91ec-4907-4c59-a16c-9cfb0508f85c",
    },
    res
  );

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
  req.metrics?.addMetric("deleteAccountConfirmationGet", MetricUnit.Count, 1);
  setOplSettings(
    {
      ...DELETE_ACCOUNT_COMMON_OPL_SETTINGS,
      contentId: "1a4650c5-3a00-4d9b-9487-4ace9c119a1b",
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
  req.metrics?.addMetric("addMfaAppMethodConfirmationGet", MetricUnit.Count, 1);
  setOplSettings(
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "95add60f-d8d3-4b24-a085-255b6010a36a",
    },
    res
  );

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
  req.metrics?.addMetric("removeMfaMethodConfirmationGet", MetricUnit.Count, 1);
  setOplSettings(
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "aaee0142-9f28-4618-bb6d-4c8ee2f8c61d",
    },
    res
  );

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
  req.metrics?.addMetric(
    "changeDefaultMfaMethodConfirmationGet",
    MetricUnit.Count,
    1
  );
  setOplSettings(
    {
      ...MFA_COMMON_OPL_SETTINGS,
      contentId: "51c6d660-4a44-4d16-a447-b42a4f626a2e",
    },
    res
  );

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

const CHANGE_DEFAULT_METHOD_CONFIRMATION_OPL_VALUES: OplSettingsLookupObject = {
  [`${mfaPriorityIdentifiers.default}_${mfaMethodTypes.authApp}`]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "87c95563-8fff-41d9-91a5-a34504d343a8",
  },
  [`${mfaPriorityIdentifiers.default}_${mfaMethodTypes.sms}`]: {
    ...MFA_COMMON_OPL_SETTINGS,
    contentId: "d165657a-aa51-4974-8902-1013645b9acc",
  },
};

export async function changeDefaultMethodConfirmationGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric(
    "changeDefaultMethodConfirmationGet",
    MetricUnit.Count,
    1
  );
  const defaultMethod = req.session.mfaMethods.find(
    (m) => m.priorityIdentifier === "DEFAULT"
  );

  if (!defaultMethod) {
    res.status(HTTP_STATUS_CODES.NOT_FOUND);
    return;
  }

  setOplSettings(
    CHANGE_DEFAULT_METHOD_CONFIRMATION_OPL_VALUES[
      `${mfaPriorityIdentifiers.default}_${defaultMethod.method.mfaMethodType}`
    ],
    res
  );

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
