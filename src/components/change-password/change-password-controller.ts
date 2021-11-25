import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { PATH_DATA, ERROR_CODES } from "../../app.constants";
import { ChangePasswordServiceInterface } from "./types";
import { changePasswordService } from "./change-password-service";
import { getNextState } from "../../utils/state-machine";
import {
  renderBadRequest,
  formatValidationError,
} from "../../utils/validation";
import { BadRequestError } from "../../utils/errors";

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
    const response = await service.updatePassword(
      accessToken,
      email,
      newPassword,
      req.ip,
      res.locals.persistentSessionId
    );

    if (response.success) {
      req.session.user.state.changePassword = getNextState(
        req.session.user.state.changePassword.value,
        "VALUE_UPDATED"
      );

      return res.redirect(PATH_DATA.PASSWORD_UPDATED_CONFIRMATION.url);
    }
    if (response.code === ERROR_CODES.NEW_PASSWORD_SAME_AS_EXISTING) {
      const error = formatValidationError(
        "password",
        req.t("pages.changePassword.password.validationError.samePassword")
      );
      return renderBadRequest(res, req, changePasswordTemplate, error);
    } else {
      throw new BadRequestError(response.message, response.code);
    }
  };
}
