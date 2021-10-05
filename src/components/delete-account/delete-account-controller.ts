import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { DeleteAccountServiceInterface } from "./types";
import { deleteAccountService } from "./delete-account-service";
import { PATH_DATA } from "../../app.constants";
import { getNextState } from "../../utils/state-machine";
import CF_CONFIG from "../../config/cf";
import { GovUkPublishingServiceInterface } from "../common/gov-uk-publishing/types";
import { govUkPublishingService } from "../common/gov-uk-publishing/gov-uk-publishing-service";

export function deleteAccountGet(req: Request, res: Response): void {
  res.render("delete-account/index.njk");
}

export function deleteAccountPost(
  service: DeleteAccountServiceInterface = deleteAccountService(),
  publishingService: GovUkPublishingServiceInterface = govUkPublishingService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email, subjectId, legacySubjectId } = req.session.user;
    const { accessToken } = req.session.user.tokens;

    await service.deleteAccount(accessToken, email, req.ip);
    await publishingService
      .notifyAccountDeleted({
        subjectId,
        legacySubjectId,
      })
      .catch((err) => {
        req.log.error(
          `Unable to send delete account notification for:${subjectId}. Error:${err.toJSON()}`
        );
      });

    req.session.user.state.deleteAccount = getNextState(
      req.session.user.state.deleteAccount.value,
      "VALUE_UPDATED"
    );

    const logoutUrl = req.oidc.endSessionUrl({
      id_token_hint: req.session.user.tokens.idToken,
      post_logout_redirect_uri:
        CF_CONFIG.url + PATH_DATA.ACCOUNT_DELETED_CONFIRMATION.url,
    });

    req.session.destroy();

    return res.redirect(logoutUrl);
  };
}
