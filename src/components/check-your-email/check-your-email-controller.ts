import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { PATH_DATA } from "../../app.constants";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import { checkYourEmailService } from "./check-your-email-service";
import {
  CheckYourEmailServiceError,
  CheckYourEmailServiceInterface,
} from "./types";
import { EventType, getNextState } from "../../utils/state-machine";
import { GovUkPublishingServiceInterface } from "../common/gov-uk-publishing/types";
import { govUkPublishingService } from "../common/gov-uk-publishing/gov-uk-publishing-service";
import { UpdateInformationInput } from "../../utils/types";
import { getRequestConfigFromExpress } from "../../utils/http";
import {
  CHANGE_EMAIL_COMMON_OPL_SETTINGS,
  setOplSettings,
} from "../../utils/opl";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

const TEMPLATE_NAME = "check-your-email/index.njk";

const setLocalOplSettings = (res: Response) => {
  setOplSettings(
    {
      ...CHANGE_EMAIL_COMMON_OPL_SETTINGS,
      contentId: "d5441a1e-28d1-455b-83fd-071cd876cd06",
    },
    res
  );
};

export function checkYourEmailGet(req: Request, res: Response): void {
  req.metrics?.addMetric("checkYourEmailGet", MetricUnit.Count, 1);
  setLocalOplSettings(res);
  res.render(TEMPLATE_NAME, {
    email: req.session.user.newEmailAddress,
  });
}

export function checkYourEmailPost(
  service: CheckYourEmailServiceInterface = checkYourEmailService(),
  publishingService: GovUkPublishingServiceInterface = govUkPublishingService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    req.metrics?.addMetric("checkYourEmailPost", MetricUnit.Count, 1);
    const { email, newEmailAddress, publicSubjectId, legacySubjectId } =
      req.session.user;

    const updateInput: UpdateInformationInput = {
      email: email,
      updatedValue: newEmailAddress,
      otp: req.body["code"],
    };

    const result = await service.updateEmail(
      updateInput,
      await getRequestConfigFromExpress(req, res)
    );

    if (result.success === true) {
      await publishingService
        .notifyEmailChanged({
          publicSubjectId: publicSubjectId,
          newEmail: newEmailAddress,
          legacySubjectId: legacySubjectId,
        })
        .catch((err) => {
          req.log.error(
            `Unable to send change email notification for:${publicSubjectId}. Error:${err}`
          );
        });

      req.session.user.email = newEmailAddress;
      delete req.session.user.newEmailAddress;

      req.session.user.state.changeEmail = getNextState(
        req.session.user.state.changeEmail.value,
        EventType.ValueUpdated
      );

      return res.redirect(PATH_DATA.EMAIL_UPDATED_CONFIRMATION.url);
    }

    if (result.error === CheckYourEmailServiceError.EMAIL_ADDRESS_DENIED) {
      req.metrics?.addMetric("changeEmailAddressDenied", MetricUnit.Count, 1);
      return res.redirect(`${PATH_DATA.CHANGE_EMAIL.url}?email_cant_be_used=1`);
    }

    setLocalOplSettings(res);
    renderBadRequest(
      res,
      req,
      TEMPLATE_NAME,
      formatValidationError(
        "code",
        req.t("pages.checkYourEmail.code.validationError.invalidCode")
      )
    );
  };
}
