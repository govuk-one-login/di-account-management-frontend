import { Request, Response } from "express";
import { EnterPasswordServiceInterface } from "./types";
import { enterPasswordService } from "./enter-password-service";
import { ExpressRouteFunc } from "../../types";
import { PATH_DATA } from "../../app.constants";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";
import {
  EventType,
  getInitialState,
  getNextState,
  UserJourney,
} from "../../utils/state-machine";
import { getTxmaHeader } from "../../utils/txma-header";

const TEMPLATE = "enter-password/index.njk";

const REDIRECT_PATHS: { [key: string]: string } = {
  changeEmail: PATH_DATA.CHANGE_EMAIL.url,
  changePassword: PATH_DATA.CHANGE_PASSWORD.url,
  changePhoneNumber: PATH_DATA.CHANGE_PHONE_NUMBER.url,
  changeAuthenticatorApp: PATH_DATA.CHANGE_AUTHENTICATOR_APP.url,
  deleteAccount: PATH_DATA.DELETE_ACCOUNT.url,
  addMfaMethod: PATH_DATA.ADD_MFA_METHOD.url,
  removeMfaMethod: PATH_DATA.DELETE_MFA_METHOD.url,
};

const OPL_VALUES: {
  [key: string]: { contentId: string; taxonomyLevel2: string };
} = {
  changeEmail: {
    contentId: "e00e882b-f54a-40d3-ac84-85737424471c",
    taxonomyLevel2: "change email",
  },
  changePassword: {
    contentId: "23d51dca-51ca-44ad-86e0-b7599ce14412",
    taxonomyLevel2: "change password",
  },
  changePhoneNumber: {
    contentId: "2f5f174d-c650-4b28-96cf-365f4fb17af1",
    taxonomyLevel2: "change phone number",
  },
  deleteAccount: {
    contentId: "c69af4c7-5496-4c11-9d22-97bd3d2e9349",
    taxonomyLevel2: "delete account",
  },
  addMfaMethod: {
    contentId: "375aa101-7bd6-43c2-ac39-19c864b49882",
    taxonomyLevel2: "add mfa method",
  },
  removeMfaMethod: {
    contentId: "375aa101-7bd6-43c2-ac39-19c864b49844",
    taxonomyLevel2: "remove backup mfa",
  },
};

export function enterPasswordGet(req: Request, res: Response): void {
  const requestType = req.query.type as UserJourney;

  if (!requestType) {
    return res.redirect(PATH_DATA.SETTINGS.url);
  }

  req.session.user.state[requestType] = getInitialState();

  res.render(`enter-password/index.njk`, {
    requestType,
    oplValues: OPL_VALUES[requestType] || {},
  });
}

export function enterPasswordPost(
  service: EnterPasswordServiceInterface = enterPasswordService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email } = req.session.user;
    const { accessToken } = req.session.user.tokens;

    const requestType = req.body.requestType as UserJourney;
    const isAuthenticated = await service.authenticated(
      accessToken,
      email,
      req.body["password"],
      req.ip,
      res.locals.sessionId,
      res.locals.persistentSessionId,
      res.locals.clientSessionId,
      getTxmaHeader(req, res.locals.trace)
    );

    if (isAuthenticated) {
      req.session.user.state[requestType] = getNextState(
        req.session.user.state[requestType].value,
        EventType.Authenticated
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
