import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { DeleteAccountServiceInterface } from "./types";
import { deleteAccountService } from "./delete-account-service";
import { PATH_DATA } from "../../app.constants";
import { getNextState } from "../../utils/state-machine";
// import { GovUkPublishingServiceInterface } from "../common/gov-uk-publishing/types";
// import { govUkPublishingService } from "../common/gov-uk-publishing/gov-uk-publishing-service";
import { getBaseUrl, getManageGovukEmailsUrl, supportDeleteServiceStore } from "../../config";
import { getSNSDeleteTopic } from "../../config";

export function deleteAccountGet(req: Request, res: Response): void {
  res.render("delete-account/index.njk", {
    manageEmailsLink: getManageGovukEmailsUrl(),
  });
}

export function deleteAccountPost(
  service: DeleteAccountServiceInterface = deleteAccountService(),
    // publishingService: GovUkPublishingServiceInterface = govUkPublishingService()
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

        // await service.deleteAccount(
        //     accessToken,
        //     email,
        //     req.ip,
        //     res.locals.sessionId,
        //     res.locals.persistentSessionId
        // );
        
        // await publishingService
        //     .notifyAccountDeleted({
        //         publicSubjectId,
        //         legacySubjectId,
        //     })
        //     .catch((err) => {
        //         req.log.error(
        //             `Unable to send delete account notification for:${subjectId}. Error:${err}`
        //         );
        //     });

    req.session.user.state.deleteAccount = getNextState(
      req.session.user.state.deleteAccount.value,
      "VALUE_UPDATED"
    );

    const logoutUrl = req.oidc.endSessionUrl({
      id_token_hint: req.session.user.tokens.idToken,
      post_logout_redirect_uri:
        getBaseUrl() + PATH_DATA.ACCOUNT_DELETED_CONFIRMATION.url,
    });

    await req.app.locals.subjectSessionIndexService
      .getSessions(req.session.user.subjectId)
      .then((sessions: string[]) =>
        sessions.forEach((sessionId: string) => {
          req.app.locals.sessionStore.destroy(sessionId);
          req.app.locals.subjectSessionIndexService.removeSession(
            req.session.user.subjectId,
            sessionId
          );
        })
      );

    return res.redirect(logoutUrl);
  };
}
