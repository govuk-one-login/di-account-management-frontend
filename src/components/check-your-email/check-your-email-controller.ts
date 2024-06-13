import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types.js";
import { PATH_DATA } from "../../app.constants.js";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation.js";
import { checkYourEmailService } from "./check-your-email-service.js";
import { CheckYourEmailServiceInterface } from "./types.js";
import { EventType, getNextState } from "../../utils/state-machine.js";
import { GovUkPublishingServiceInterface } from "../common/gov-uk-publishing/types.js";
import { govUkPublishingService } from "../common/gov-uk-publishing/gov-uk-publishing-service.js";
import xss from "xss";
import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../../utils/types.js";
import { getTxmaHeader } from "../../utils/txma-header.js";

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

    const sessionDetails: UpdateInformationSessionValues = {
      accessToken: req.session.user.tokens.accessToken,
      sourceIp: req.ip,
      sessionId: res.locals.sessionId,
      persistentSessionId: res.locals.persistentSessionId,
      userLanguage: xss(req.cookies.lng as string),
      clientSessionId: res.locals.clientSessionId,
      txmaAuditEncoded: getTxmaHeader(req, res.locals.trace),
    };

    const isEmailUpdated = await service.updateEmail(
      updateInput,
      sessionDetails
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
