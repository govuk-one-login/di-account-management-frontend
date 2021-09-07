import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { PATH_DATA } from "../../app.constants";
import { ChangePasswordServiceInterface } from "./types";
import { changePasswordService } from "./change-password-service";
import { getNextState } from "../../utils/state-machine";

export function changePasswordGet(req: Request, res: Response): void {
  res.render("change-password/index.njk");
}

export function changePasswordPost(
  service: ChangePasswordServiceInterface = changePasswordService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { accessToken, email } = req.session.user;
    const newPassword = req.body.password as string;

    await service.updatePassword(accessToken, email, newPassword);

    req.session.user.state.changePassword = getNextState(
      req.session.user.state.changePassword.value,
      "VALUE_UPDATED"
    );

    return res.redirect(PATH_DATA.PASSWORD_UPDATED_CONFIRMATION.url);
  };
}
