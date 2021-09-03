import { Request, Response } from "express";
import { EnterPasswordServiceInterface } from "./types";
import { enterPasswordService } from "./enter-password-service";
import { ExpressRouteFunc } from "../../types";
import { PATH_NAMES } from "../../app.constants";
import {
  formatValidationError,
  renderBadRequest,
} from "../../utils/validation";

const ENTER_PASSWORD_TEMPLATE = "enter-password/index.njk";
const ENTER_PASSWORD_VALIDATION_KEY =
  "pages.enterPassword.password.validationError.incorrectPassword";

export function enterPasswordGet(req: Request, res: Response): void {
  res.render("enter-password/index.njk");
}

export function enterPasswordPost(
  service: EnterPasswordServiceInterface = enterPasswordService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const email = req.session.user.email;
    const accessToken = req.session.user.accessToken;
    const authenticated = await service.authenticated(
      accessToken,
      email,
      req.body["password"]
    );
    if (authenticated) {
      return res.redirect(PATH_NAMES.ENTER_NEW_EMAIL);
    }
    renderValidationError(
      req,
      res,
      ENTER_PASSWORD_TEMPLATE,
      ENTER_PASSWORD_VALIDATION_KEY
    );
  };
}

function renderValidationError(
  req: Request,
  res: Response,
  fromTemplateName: string,
  validationMessageKey: string
) {
  const error = formatValidationError("password", req.t(validationMessageKey));
  renderBadRequest(res, req, fromTemplateName, error);
}
