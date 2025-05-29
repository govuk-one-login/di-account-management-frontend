import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { PATH_DATA } from "../../app.constants";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import { checkYourEmailService } from "./check-your-email-service";
import { CheckYourEmailServiceInterface } from "./types";
import { EventType, getNextState } from "../../utils/state-machine";
import { GovUkPublishingServiceInterface } from "../common/gov-uk-publishing/types";
import { govUkPublishingService } from "../common/gov-uk-publishing/gov-uk-publishing-service";
import { UpdateInformationInput } from "../../utils/types";
import { getRequestConfigFromExpress } from "../../utils/http";

const TEMPLATE_NAME = "check-your-email/index.njk";

export function checkYourEmailGet(req: Request, res: Response): void {
  res.render(TEMPLATE_NAME, {
    email: req.session.user.newEmailAddress,
  });
}

export function checkYourEmailPost(
  service: CheckYourEmailServiceInterface = checkYourEmailService(),
  publishingService: GovUkPublishingServiceInterface = govUkPublishingService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email, newEmailAddress, publicSubjectId, legacySubjectId } =
      req.session.user;

    const updateInput: UpdateInformationInput = {
      email: email,
      updatedValue: newEmailAddress,
      otp: req.body["code"],
    };

    const isEmailUpdated = await service.updateEmail(
      updateInput,
      getRequestConfigFromExpress(req, res)
    );

    if (isEmailUpdated) {
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

    const error = formatValidationError(
      "code",
      req.t("pages.checkYourEmail.code.validationError.invalidCode")
    );

    renderBadRequest(res, req, TEMPLATE_NAME, error);
  };
}

export function requestNewCodeGet(req: Request, res: Response): void {
  req.session.user.state.changeEmail = getNextState(
    req.session.user.state.changeEmail.value,
    EventType.ResendCode
  );

  return res.redirect(PATH_DATA.CHANGE_EMAIL.url);
}
