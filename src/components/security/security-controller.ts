import { Request, Response } from "express";
import { supportGlobalLogout } from "../../config";
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
  priorityIdentifier: string
) {
  const lastDigits = getLastNDigits(phoneNumber, 4);
  return {
    text: t(
      "pages.security.mfaSection.defaultMethod.phoneNumber.title"
    ).replace("[phoneNumber]", lastDigits),
    linkText: t("pages.security.mfaSection.defaultMethod.phoneNumber.change"),
    linkHref: `${enterPasswordUrl}&type=changePhoneNumber`,
    priorityIdentifier,
  };
}

function handleAuthAppMethod(
  enterPasswordUrl: string,
  t: (key: string) => string,
  priorityIdentifier: string
) {
  return {
    text: t("pages.security.mfaSection.defaultMethod.app.title"),
    linkText: t("pages.security.mfaSection.defaultMethod.app.change"),
    linkHref: `${enterPasswordUrl}&type=changeAuthApp`,
    priorityIdentifier,
  };
}

function mapMfaMethods(
  mfaMethods: MfaMethod[],
  enterPasswordUrl: string,
  t: (key: string) => string
) {
  return mfaMethods.map(({ method, priorityIdentifier }) => {
    const { mfaMethodType } = method;

    if (mfaMethodType === "SMS") {
      return handleSmsMethod(
        method.phoneNumber,
        enterPasswordUrl,
        t,
        priorityIdentifier
      );
    }

    if (mfaMethodType === "AUTH_APP") {
      return handleAuthAppMethod(enterPasswordUrl, t, priorityIdentifier);
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

  const hasActivityLog = await hasAllowedActivityLogServices(req, res);

  const mfaMethods = Array.isArray(req.session.mfaMethods)
    ? mapMfaMethods(req.session.mfaMethods, enterPasswordUrl, req.t)
    : [];

  const denyChangeTypeofPrimary = Array.isArray(req.session.mfaMethods)
    ? canChangePrimaryMethod(req.session.mfaMethods)
    : false;

  setOplSettings(
    {
      contentId: "caaccf0a-1dd3-441c-af20-01925c8f9cba",
    },
    res
  );

  res.render("security/index.njk", {
    email,
    hasActivityLog,
    activityLogUrl: PATH_DATA.SIGN_IN_HISTORY.url,
    enterPasswordUrl,
    mfaMethods,
    canChangeTypeofPrimary: !denyChangeTypeofPrimary,
    supportGlobalLogout: supportGlobalLogout(),
  });
}
