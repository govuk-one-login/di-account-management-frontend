import { Request, Response } from "express";
import { EnterPasswordServiceInterface } from "./types";
import { enterPasswordService } from "./enter-password-service";
import { ExpressRouteFunc } from "../../types";
import { PATH_DATA } from "../../app.constants";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import { getInitialState, getNextState } from "../../utils/state-machine";

const TEMPLATE = "enter-password/index.njk";

const REDIRECT_PATHS: { [key: string]: string } = {
  changeEmail: PATH_DATA.CHANGE_EMAIL.url,
  changePassword: PATH_DATA.CHANGE_PASSWORD.url,
  changePhoneNumber: PATH_DATA.CHANGE_PHONE_NUMBER.url,
  deleteAccount: PATH_DATA.DELETE_ACCOUNT.url,
};

export function enterPasswordGet(req: Request, res: Response): void {
  const requestType = req.query.type as string;

  if (!requestType) {
    return res.redirect(PATH_DATA.MANAGE_YOUR_ACCOUNT.url);
  }

  req.session.user.state[requestType] = getInitialState();

  res.render(`enter-password/index.njk`, { requestType });
}

export function enterPasswordPost(
  service: EnterPasswordServiceInterface = enterPasswordService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email } = req.session.user;
    const { accessToken } = req.session.user.tokens;

    const requestType = req.body.requestType;
    const isAuthenticated = await service.authenticated(
      accessToken,
      email,
      req.body["password"]
    );

    if (isAuthenticated) {
      req.session.user.state[requestType] = getNextState(
        req.session.user.state[requestType].value,
        "AUTHENTICATED"
      );

      return res.redirect(REDIRECT_PATHS[requestType]);
    }

    const error = formatValidationError(
      "password",
      req.t("pages.enterPassword.password.validationError.incorrectPassword")
    );

    renderBadRequest(res, req, TEMPLATE, error);
  };
}
