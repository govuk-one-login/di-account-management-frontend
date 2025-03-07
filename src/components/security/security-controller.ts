import { Request, Response } from "express";
import {
  supportActivityLog,
  supportChangeMfa,
  supportAddBackupMfa,
} from "../../config";
import { PATH_DATA } from "../../app.constants";
import { hasAllowedRSAServices } from "../../middleware/check-allowed-services-list";
import { getLastNDigits } from "../../utils/phone-number";

export async function securityGet(req: Request, res: Response): Promise<void> {
  const { email } = req.session.user;
  const enterPasswordUrl = `${PATH_DATA.ENTER_PASSWORD.url}?from=security&edit=true`;
  const supportActivityLogFlag = supportActivityLog();
  const isChangeMfaSupported = supportChangeMfa();
  const hasHmrc = await hasAllowedRSAServices(req, res);
  const activityLogUrl = PATH_DATA.SIGN_IN_HISTORY.url;

  if (
    !Array.isArray(req.session.mfaMethods) ||
    req.session.mfaMethods.length === 0
  ) {
    res.render("security/index.njk", {
      email,
      supportActivityLog: supportActivityLogFlag && hasHmrc,
      activityLogUrl,
      enterPasswordUrl,
      mfaMethods: [],
      supportChangeMfa: isChangeMfaSupported,
      supportAddBackupMfa: supportAddBackupMfa(),
      canChangeTypeofPrimary: false,
    });
    return;
  }

  const mapMfaMethods = (mfaMethod: {
    method: { mfaMethodType: any; phoneNumber: any };
    priorityIdentifier: any;
  }) => {
    const { mfaMethodType, phoneNumber } = mfaMethod.method;
    if (mfaMethodType === "SMS") {
      const lastDigits = getLastNDigits(phoneNumber, 4);
      return isChangeMfaSupported
        ? {
            text: req
              .t(
                "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.title"
              )
              .replace("[phoneNumber]", lastDigits),
            linkHref: `${enterPasswordUrl}&type=changePhoneNumber`,
            linkText: req.t(
              "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.change"
            ),
            priorityIdentifier: mfaMethod.priorityIdentifier,
          }
        : {
            type: mfaMethodType,
            classes: "govuk-summary-list__row--no-border",
            key: {
              text: req.t(
                "pages.security.mfaSection.summaryList.phoneNumber.title"
              ),
            },
            value: {
              text: req
                .t("pages.security.mfaSection.summaryList.phoneNumber.value")
                .replace("[phoneNumber]", lastDigits),
            },
            actions: {
              items: [
                {
                  attributes: { "data-test-id": "change-phone-number" },
                  href: `${enterPasswordUrl}&type=changePhoneNumber`,
                  text: req.t("general.change"),
                  visuallyHiddenText: req.t(
                    "pages.security.mfaSection.summaryList.phoneNumber.hiddenText"
                  ),
                },
              ],
            },
          };
    } else if (mfaMethodType === "AUTH_APP") {
      return isChangeMfaSupported
        ? {
            text: req.t(
              "pages.security.mfaSection.supportChangeMfa.defaultMethod.app.title"
            ),
            linkHref: `${enterPasswordUrl}&type=changeAuthenticatorApp`,
            linkText: req.t(
              "pages.security.mfaSection.supportChangeMfa.defaultMethod.app.change"
            ),
            priorityIdentifier: mfaMethod.priorityIdentifier,
          }
        : {
            type: mfaMethodType,
            classes: "govuk-summary-list__row--no-border",
            key: {
              text: req.t("pages.security.mfaSection.summaryList.app.title"),
            },
          };
    } else {
      throw new Error(`Unexpected mfaMethodType: ${mfaMethodType}`);
    }
  };

  const mfaMethods = req.session.mfaMethods.map(mapMfaMethods);

  const denyChangeTypeofPrimary =
    isChangeMfaSupported &&
    req.session.mfaMethods.length > 1 &&
    req.session.mfaMethods.some(
      (m) =>
        m.method.mfaMethodType === "SMS" && m.priorityIdentifier === "DEFAULT"
    ) &&
    req.session.mfaMethods.some(
      (m) =>
        m.method.mfaMethodType === "AUTH_APP" &&
        m.priorityIdentifier === "BACKUP"
    );

  const data = {
    email,
    supportActivityLog: supportActivityLogFlag && hasHmrc,
    activityLogUrl,
    enterPasswordUrl,
    mfaMethods,
    supportChangeMfa: isChangeMfaSupported,
    supportAddBackupMfa: supportAddBackupMfa(),
    canChangeTypeofPrimary: !denyChangeTypeofPrimary,
  };

  res.render("security/index.njk", data);
}
