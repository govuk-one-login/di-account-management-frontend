import { Request, Response } from "express";
import {
  supportActivityLog,
  supportChangeMfa,
  supportAddBackupMfa,
} from "../../config";
import { PATH_DATA } from "../../app.constants";
import { hasAllowedRSAServices } from "../../middleware/check-allowed-services-list";
import { getLastNDigits } from "../../utils/phone-number";

const supportActivityLogFlag = supportActivityLog();
const changeMfaEnabled = supportChangeMfa();
const addBackupMfa = supportAddBackupMfa();

const getMFAMethodDetails = (
  req: Request,
  mfaMethod: any,
  changeMfaEnabled: boolean
) => {
  const { method } = mfaMethod;
  const enterPasswordUrl = `${PATH_DATA.ENTER_PASSWORD.url}?from=security`;

  if (method.mfaMethodType === "SMS") {
    const phoneNumber = getLastNDigits(method.phoneNumber, 4);
    return changeMfaEnabled
      ? {
          text: req
            .t(
              "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.title"
            )
            .replace("[phoneNumber]", phoneNumber),
          linkText: req.t(
            "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.change"
          ),
          linkHref: `${enterPasswordUrl}&type=changePhoneNumber`,
          priorityIdentifier: mfaMethod.priorityIdentifier,
        }
      : {
          type: method.mfaMethodType,
          classes: "govuk-summary-list__row--no-border",
          key: {
            text: req.t(
              "pages.security.mfaSection.summaryList.phoneNumber.title"
            ),
          },
          value: {
            text: req
              .t("pages.security.mfaSection.summaryList.phoneNumber.value")
              .replace("[phoneNumber]", phoneNumber),
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
  } else if (method.mfaMethodType === "AUTH_APP") {
    return changeMfaEnabled
      ? {
          text: req.t(
            "pages.security.mfaSection.supportChangeMfa.defaultMethod.app.title"
          ),
          linkText: req.t(
            "pages.security.mfaSection.supportChangeMfa.defaultMethod.app.change"
          ),
          linkHref: `${enterPasswordUrl}&type=changeAuthenticatorApp`,
          priorityIdentifier: mfaMethod.priorityIdentifier,
        }
      : {
          type: method.mfaMethodType,
          classes: "govuk-summary-list__row--no-border",
          key: {
            text: req.t("pages.security.mfaSection.summaryList.app.title"),
          },
        };
  } else {
    throw new Error(`Unexpected mfaMethodType: ${method.mfaMethodType}`);
  }
};

export async function securityGet(req: Request, res: Response): Promise<void> {
  const { email } = req.session.user;
  const hasHmrc = await hasAllowedRSAServices(req, res);

  const denyChangeTypeofPrimary =
    changeMfaEnabled &&
    Array.isArray(req.session.mfaMethods) &&
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

  const mfaMethods = (req.session.mfaMethods || []).map((mfaMethod) =>
    getMFAMethodDetails(req, mfaMethod, changeMfaEnabled)
  );

  const data = {
    email,
    supportActivityLog: supportActivityLogFlag && hasHmrc,
    activityLogUrl: PATH_DATA.SIGN_IN_HISTORY.url,
    enterPasswordUrl: `${PATH_DATA.ENTER_PASSWORD.url}?from=security`,
    mfaMethods,
    supportChangeMfa: changeMfaEnabled,
    supportAddBackupMfa: addBackupMfa,
    canChangeTypeofPrimary: !denyChangeTypeofPrimary,
  };

  res.render("security/index.njk", data);
}
