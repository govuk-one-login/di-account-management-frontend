import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { DeleteAccountServiceInterface } from "./types";
import { deleteAccountService } from "./delete-account-service";
import { PATH_DATA } from "../../app.constants";
import { getNextState } from "../../utils/state-machine";
import { getBaseUrl, getManageGovukEmailsUrl, supportDeleteServiceStore } from "../../config";
import { getSNSDeleteTopic } from "../../config";
import { destroyUserSessions } from "../../utils/session-store";

export function deleteAccountGet(req: Request, res: Response): void {
  res.render("delete-account/index.njk", {
    manageEmailsLink: getManageGovukEmailsUrl(),
  });
}

export function deleteAccountPost(
  service: DeleteAccountServiceInterface = deleteAccountService(),
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email, subjectId, publicSubjectId, legacySubjectId } =
      req.session.user;
    const { accessToken } = req.session.user.tokens;
    
    if (supportDeleteServiceStore()) {
      const DeleteTopicARN = getSNSDeleteTopic()
      try {
        await service.deleteServiceData(subjectId, accessToken, email, req.ip, res.locals.sessionId, res.locals.persistentSessionId, publicSubjectId, legacySubjectId, DeleteTopicARN)
      } catch (err) {
        req.log.error(`Unable to publish delete topic message for: ${subjectId} and ARN ${DeleteTopicARN}. Error:${err}`)
      }
    }

    req.session.user.state.deleteAccount = getNextState(
      req.session.user.state.deleteAccount.value,
      "VALUE_UPDATED"
    );

    const logoutUrl = req.oidc.endSessionUrl({
      id_token_hint: req.session.user.tokens.idToken,
      post_logout_redirect_uri:
        getBaseUrl() + PATH_DATA.ACCOUNT_DELETED_CONFIRMATION.url,
    });

    await destroyUserSessions(subjectId, req.app.locals.sessionStore);

    return res.redirect(logoutUrl);
  };
}
