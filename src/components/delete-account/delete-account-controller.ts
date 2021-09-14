import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { DeleteAccountServiceInterface } from "./types";
import { deleteAccountService } from "./delete-account-service";
import { PATH_DATA } from "../../app.constants";
import { getNextState } from "../../utils/state-machine";

export function deleteAccountGet(req: Request, res: Response): void {
  res.render("delete-account/index.njk");
}

export function deleteAccountPost(
  service: DeleteAccountServiceInterface = deleteAccountService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email, accessToken } = req.session.user;

    await service.deleteAccount(accessToken, email);

    req.session.user.state.deleteAccount = getNextState(
      req.session.user.state.deleteAccount.value,
      "VALUE_UPDATED"
    );

    return res.redirect(PATH_DATA.ACCOUNT_DELETED_CONFIRMATION.url);
  };
}
