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
    const email = "";
    const id = "";
    const userPassword = await service.checkUserPassword(
      id,
      email,
      req.body["password"]
    );

    if (userPassword.isValidPassword) {
      // TODO: this page does not exist
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
