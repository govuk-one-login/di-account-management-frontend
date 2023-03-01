import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { DeleteAccountServiceInterface } from "./types";
import { deleteAccountService } from "./delete-account-service";
import { PATH_DATA } from "../../app.constants";
import { getNextState } from "../../utils/state-machine";
import { GovUkPublishingServiceInterface } from "../common/gov-uk-publishing/types";
import { govUkPublishingService } from "../common/gov-uk-publishing/gov-uk-publishing-service";
import {
  getAppEnv,
  getBaseUrl,
  getManageGovukEmailsUrl,
  supportDeleteServiceStore,
  getSNSDeleteTopic,
} from "../../config";

import { destroyUserSessions } from "../../utils/session-store";
<<<<<<< Updated upstream
import {
  containsGovUkPublishingService,
  presentYourServices,
} from "../../utils/yourServices";
import { Service } from "../../utils/types";
=======
import { containsGovUkPublishingService } from "../../utils/yourServices";
import { Service } from "../../utils/types";
import { getAllowedListServices } from "../../utils/yourServices";
>>>>>>> Stashed changes

export async function deleteAccountGet(
  req: Request,
  res: Response
): Promise<void> {
  const env = getAppEnv();
  const { user } = req.session;
  if (user && user.subjectId) {
<<<<<<< Updated upstream
    const serviceData = await presentYourServices(user.subjectId);
    const services: Service[] = serviceData.accountsList.concat(
      serviceData.servicesList
    );
=======
    const services: Service[] = await getAllowedListServices(user.subjectId);
>>>>>>> Stashed changes
    const hasGovUkEmailSubscription: boolean =
      containsGovUkPublishingService(services);
    const data = {
      hasGovUkEmailSubscription: hasGovUkEmailSubscription,
      services: services,
      env: env,
      manageEmailsLink: getManageGovukEmailsUrl(),
    };
    res.render("delete-account/index.njk", data);
  } else {
    const data = {
      env: env,
      manageEmailsLink: getManageGovukEmailsUrl(),
    };
    res.render("delete-account/index.njk", data);
  }
}

export function deleteAccountPost(
  service: DeleteAccountServiceInterface = deleteAccountService(),
  publishingService: GovUkPublishingServiceInterface = govUkPublishingService()
): ExpressRouteFunc {
  return async function (req: Request, res: Response) {
    const { email, subjectId, publicSubjectId, legacySubjectId } =
      req.session.user;
    const { accessToken } = req.session.user.tokens;

    if (supportDeleteServiceStore()) {
      const DeleteTopicARN = getSNSDeleteTopic();
      try {
        await service.deleteServiceData(subjectId, DeleteTopicARN);
      } catch (err) {
        req.log.error(
          `Unable to publish delete topic message for: ${subjectId} and ARN ${DeleteTopicARN}. Error:${err}`
        );
      }
    }

    await service.deleteAccount(
      accessToken,
      email,
      req.ip,
      res.locals.sessionId,
      res.locals.persistentSessionId
    );
    await publishingService
      .notifyAccountDeleted({
        publicSubjectId,
        legacySubjectId,
      })
      .catch((err) => {
        req.log.error(
          `Unable to send delete account notification for:${subjectId}. Error:${err}`
        );
      });

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
