import { Request, Response } from "express";
import {
  supportActivityLog,
  supportChangeMfa,
  supportAddBackupMfa,
  supportGlobalLogout,
} from "../../config";
import { PATH_DATA } from "../../app.constants";
import { hasAllowedActivityLogServices } from "../../middleware/check-allowed-services-list";
import { getLastNDigits } from "../../utils/phone-number";
import { MfaMethod } from "src/utils/mfaClient/types";
import { setOplSettings } from "../../utils/opl";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

function handleSmsMethod(
  phoneNumber: string,
  enterPasswordUrl: string,
  t: (key: string) => string,
  supportMfaChange: boolean,
  priorityIdentifier: string
) {
  const lastDigits = getLastNDigits(phoneNumber, 4);
  return supportMfaChange
    ? {
        text: t(
          "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.title"
        ).replace("[phoneNumber]", lastDigits),
        linkText: t(
          "pages.security.mfaSection.supportChangeMfa.defaultMethod.phoneNumber.change"
        ),
        linkHref: `${enterPasswordUrl}&type=changePhoneNumber`,
        priorityIdentifier,
      }
    : {
        type: "SMS",
        classes: "govuk-summary-list__row--no-border",
        key: {
          text: t("pages.security.mfaSection.summaryList.phoneNumber.title"),
        },
        value: {
          text: phoneNumber
            ? t(
                "pages.security.mfaSection.summaryList.phoneNumber.value"
              ).replace("[phoneNumber]", lastDigits)
            : t("pages.security.mfaSection.summaryList.phoneNumber.notSet"),
        },
        actions: {
          items: [
            {
              attributes: { "data-test-id": "change-phone-number" },
              href: `${enterPasswordUrl}&type=changePhoneNumber`,
              text: t(
                "pages.security.mfaSection.summaryList.phoneNumber.change"
              ),
            },
          ],
        },
      };
}

function handleAuthAppMethod(
  enterPasswordUrl: string,
  t: (key: string) => string,
  supportMfaChange: boolean,
  priorityIdentifier: string
) {
  return supportMfaChange
    ? {
        text: t(
          "pages.security.mfaSection.supportChangeMfa.defaultMethod.app.title"
        ),
        linkText: t(
          "pages.security.mfaSection.supportChangeMfa.defaultMethod.app.change"
        ),
        linkHref: `${enterPasswordUrl}&type=changeAuthApp`,
        priorityIdentifier,
      }
    : {
        type: "AUTH_APP",
        classes: "govuk-summary-list__row--no-border",
        key: { text: t("pages.security.mfaSection.summaryList.app.title") },
        value: { text: "" },
        actions: {},
      };
}

function mapMfaMethods(
  mfaMethods: MfaMethod[],
  enterPasswordUrl: string,
  t: (key: string) => string,
  supportMfaChange: boolean
) {
  return mfaMethods.map(({ method, priorityIdentifier }) => {
    const { mfaMethodType } = method;

    if (mfaMethodType === "SMS") {
      return handleSmsMethod(
        method.phoneNumber,
        enterPasswordUrl,
        t,
        supportMfaChange,
        priorityIdentifier
      );
    }

    if (mfaMethodType === "AUTH_APP") {
      return handleAuthAppMethod(
        enterPasswordUrl,
        t,
        supportMfaChange,
        priorityIdentifier
      );
    }

    throw new Error(`Unexpected mfaMethodType: ${mfaMethodType}`);
  });
}

function canChangePrimaryMethod(mfaMethods: MfaMethod[]): boolean {
  return (
    mfaMethods.length > 1 &&
    mfaMethods.some(
      (m) =>
        m.method.mfaMethodType === "SMS" && m.priorityIdentifier === "DEFAULT"
    ) &&
    mfaMethods.some(
      (m) =>
        m.method.mfaMethodType === "AUTH_APP" &&
        m.priorityIdentifier === "BACKUP"
    )
  );
}

export async function securityGet(req: Request, res: Response): Promise<void> {
  req.metrics?.addMetric("securityGet", MetricUnit.Count, 1);
  const { email } = req.session.user;
  const enterPasswordUrl = `${PATH_DATA.ENTER_PASSWORD.url}?from=security&edit=true`;

  const supportMfaChange = supportChangeMfa(req.cookies);
  const supportBackupMfa = supportAddBackupMfa(req.cookies);
  const supportActivityLogFlag = supportActivityLog();

  const hasActivityLog = await hasAllowedActivityLogServices(req, res);

  const mfaMethods = Array.isArray(req.session.mfaMethods)
    ? mapMfaMethods(
        req.session.mfaMethods,
        enterPasswordUrl,
        req.t,
        supportMfaChange
      )
    : [];

  const denyChangeTypeofPrimary = Array.isArray(req.session.mfaMethods)
    ? supportChangeMfa(req.cookies) &&
      canChangePrimaryMethod(req.session.mfaMethods)
    : false;

  setOplSettings(
    {
      contentId: "caaccf0a-1dd3-441c-af20-01925c8f9cba",
    },
    res
  );

  res.render("security/index.njk", {
    email,
    supportActivityLog: supportActivityLogFlag && hasActivityLog,
    activityLogUrl: PATH_DATA.SIGN_IN_HISTORY.url,
    enterPasswordUrl,
    mfaMethods,
    supportChangeMfa: supportMfaChange,
    supportAddBackupMfa: supportBackupMfa,
    canChangeTypeofPrimary: !denyChangeTypeofPrimary,
    supportGlobalLogout: supportGlobalLogout(),
  });
}
