import {Request, Response} from "express";
import {ExpressRouteFunc} from "../../types";
import {DeleteAccountServiceInterface} from "./types";
import {deleteAccountService} from "./delete-account-service";

export function deleteAccountGet(req: Request, res: Response): void {
    res.render("delete-account/index.njk");
}

export function deleteAccountPost(
    service: DeleteAccountServiceInterface = deleteAccountService()
): ExpressRouteFunc {
    return async function (req: Request, res: Response) {
        const email = req.session.user.email;
        const accessToken = req.session.user.accessToken;

        await service.deleteAccount(accessToken, email);

        return res.render("delete-account/confirmed.njk");
    };
}