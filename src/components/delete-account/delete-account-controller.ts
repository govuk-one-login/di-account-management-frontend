import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types.js";
import { DeleteAccountServiceInterface } from "./types.js";
import { deleteAccountService } from "./delete-account-service.js";
import { PATH_DATA } from "../../app.constants.js";
import { EventType, getNextState } from "../../utils/state-machine.js";
import { getAppEnv, getBaseUrl, getSNSDeleteTopic } from "../../config.js";
import {
  clearCookies,
  destroyUserSessions,
} from "../../utils/session-store.js";
import {
  containsGovUkPublishingService,
  getAllowedListServices,
} from "../../utils/yourServices.js";
import { Service } from "../../utils/types.js";
import { getTxmaHeader } from "../../utils/txma-header.js";

export async function deleteAccountGet(
  req: Request,
  res: Response
): Promise<void> {
  const env = getAppEnv();
  const { user } = req.session;
  if (user?.subjectId) {
    const services: Service[] = await getAllowedListServices(
      user.subjectId,
      res.locals.trace
    );
    const hasGovUkEmailSubscription: boolean =
      containsGovUkPublishingService(services);
    const data = {
      hasGovUkEmailSubscription: hasGovUkEmailSubscription,
      services: services,
      env: env,
    };
    res.render("delete-account/index.njk", data);
  } else {
    const data = {
      env: env,
    };
    res.render("delete-account/index.njk", data);
  }
}

export function deleteAccountPost(
  service: DeleteAccountServiceInterface = deleteAccountService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email, subjectId, publicSubjectId, legacySubjectId } =
      req.session.user;
    const { accessToken } = req.session.user.tokens;

    const deleteAccount = await service.deleteAccount(
      accessToken,
      email,
      req.ip,
      res.locals.sessionId,
      res.locals.persistentSessionId,
      res.locals.clientSessionId,
      getTxmaHeader(req, res.locals.trace)
    );

    const DeleteTopicARN = getSNSDeleteTopic();
    if (deleteAccount) {
      try {
        await service.publishToDeleteTopic(
          subjectId,
          publicSubjectId,
          legacySubjectId,
          DeleteTopicARN
        );
      } catch (err) {
        req.log.error(
          `Unable to publish delete topic message for: ${subjectId} and ${publicSubjectId}and ARN ${DeleteTopicARN}. Error:${err}`
        );
      }
    }

    req.session.user.state.deleteAccount = getNextState(
      req.session.user.state.deleteAccount.value,
      EventType.ValueUpdated
    );

    const logoutUrl = req.oidc.endSessionUrl({
      id_token_hint: req.session.user.tokens.idToken,
      post_logout_redirect_uri:
        getBaseUrl() + PATH_DATA.ACCOUNT_DELETED_CONFIRMATION.url,
    });

    await destroyUserSessions(req, subjectId, req.app.locals.sessionStore);

    clearCookies(req, res, ["am"]);

    return res.redirect(logoutUrl);
  };
}
