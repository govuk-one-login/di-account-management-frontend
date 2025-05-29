import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { PATH_DATA, ERROR_CODES } from "../../app.constants";
import { ChangePasswordServiceInterface } from "./types";
import { changePasswordService } from "./change-password-service";
import { EventType, getNextState } from "../../utils/state-machine";
import {
  renderBadRequest,
  formatValidationError,
} from "../../utils/validation";
import { BadRequestError } from "../../utils/errors";
import xss from "xss";
import { getTxmaHeader } from "../../utils/txma-header";

const changePasswordTemplate = "change-password/index.njk";

export function changePasswordGet(req: Request, res: Response): void {
  res.render(changePasswordTemplate);
}

export function changePasswordPost(
  service: ChangePasswordServiceInterface = changePasswordService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email } = req.session.user;
    const { accessToken } = req.session.user.tokens;

    const newPassword = req.body.password as string;
    const response = await service.updatePassword(email, newPassword, {
      token: accessToken,
      sourceIp: req.ip,
      sessionId: res.locals.sessionId,
      persistentSessionId: res.locals.persistentSessionId,
      userLanguage: xss(req.cookies.lng as string),
      clientSessionId: res.locals.clientSessionId,
      txmaAuditEncoded: getTxmaHeader(req, res.locals.trace),
    });

    if (response.success) {
      req.session.user.state.changePassword = getNextState(
        req.session.user.state.changePassword.value,
        EventType.ValueUpdated
      );

      return res.redirect(PATH_DATA.PASSWORD_UPDATED_CONFIRMATION.url);
    }
    if (response.code === ERROR_CODES.NEW_PASSWORD_SAME_AS_EXISTING) {
      const error = formatValidationError(
        "password",
        req.t("pages.changePassword.password.validationError.samePassword")
      );
      return renderBadRequest(res, req, changePasswordTemplate, error);
    }
    if (response.code === ERROR_CODES.PASSWORD_IS_COMMON) {
      const error = formatValidationError(
        "password",
        req.t("pages.changePassword.password.validationError.commonPassword")
      );
      return renderBadRequest(res, req, changePasswordTemplate, error);
    } else {
      throw new BadRequestError(response.message, response.code);
    }
  };
}
