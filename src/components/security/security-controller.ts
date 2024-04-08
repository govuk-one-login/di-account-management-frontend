import { Request, Response } from "express";
import { supportActivityLog, supportChangeMfa } from "../../config";
import { PATH_DATA } from "../../app.constants";
import { hasAllowedRSAServices } from "../../middleware/check-allowed-services-list";
import { getLastNDigits } from "../../utils/phone-number";

export async function securityGet(req: Request, res: Response): Promise<void> {
  const { email } = req.session.user;

  const supportActivityLogFlag = supportActivityLog();

  const hasHmrc = await hasAllowedRSAServices(req, res);

  const activityLogUrl = PATH_DATA.SIGN_IN_HISTORY.url;

  const mfaMethods = Array.isArray(req.session.mfaMethods)
    ? req.session.mfaMethods.map((method) => {
        let key: string,
          value: string,
          actions = {};

        if (method.mfaMethodType === "SMS") {
          const phoneNumber = getLastNDigits(method.endPoint, 4);
          key = req.t(
            "pages.security.mfaSection.summaryList.phoneNumber.title"
          );
          value = req
            .t("pages.security.mfaSection.summaryList.phoneNumber.value")
            .replace("[phoneNumber]", phoneNumber);
          actions = {
            items: [
              {
                attributes: { "data-test-id": "change-phone-number" },
                href: "/enter-password?type=changePhoneNumber",
                text: req.t("general.change"),
                visuallyHiddenText: req.t(
                  "pages.security.mfaSection.summaryList.app.hiddenText"
                ),
              },
            ],
          };
        } else if (method.mfaMethodType === "AUTH_APP") {
          key = req.t("pages.security.mfaSection.summaryList.app.title");
          value = req.t("pages.security.mfaSection.summaryList.app.value");
        } else {
          throw new Error(`Unexpected mfaMethodType: ${method.mfaMethodType}`);
        }

        return {
          classes: "govuk-summary-list__row--no-border",
          key: {
            text: key,
          },
          value: {
            text: value,
          },
          actions: actions,
        };
      })
    : [];

  const hasAuthAppMethod = req.session.mfaMethods?.some((method) => {
    return method.mfaMethodType === "AUTH_APP";
  });

  const showAdditionalMethodUpsell =
    supportChangeMfa() &&
    req.session.mfaMethods.length === 1 &&
    !hasAuthAppMethod;

  const data = {
    email,
    supportActivityLog: supportActivityLogFlag && hasHmrc,
    activityLogUrl,
    mfaMethods,
    showAdditionalMethodUpsell,
  };

  res.render("security/index.njk", data);
}
