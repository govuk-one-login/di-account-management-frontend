import { Request, Response } from "express";
import { ExpressRouteFunc } from "../../types";
import { DeleteAccountServiceInterface } from "./types";
import { deleteAccountService } from "./delete-account-service";
import { EventType, getNextState } from "../../utils/state-machine";
import { getAppEnv, getSNSDeleteTopic } from "../../config";
import {
  containsGovUkPublishingService,
  getYourServicesForAccountDeletion,
} from "../../utils/yourServices";
import { getTxmaHeader } from "../../utils/txma-header";
import { handleLogout } from "../../utils/logout";
import { LogoutState } from "../../app.constants";

export async function deleteAccountGet(
  req: Request,
  res: Response
): Promise<void> {
  const env = getAppEnv();
  const { user } = req.session;
  if (user?.subjectId) {
    const services = await getYourServicesForAccountDeletion(
      user.subjectId,
      res.locals.trace,
      req.t
    );

    const hasEnglishOnlyServices = services.some(
      (service) => !service.isAvailableInWelsh
    );
    const hasGovUkEmailSubscription: boolean =
      containsGovUkPublishingService(services);
    const data = {
      hasGovUkEmailSubscription: hasGovUkEmailSubscription,
      services: services,
      env: env,
      currentLngWelsh: req.i18n?.language === "cy",
      hasEnglishOnlyServices,
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
      } catch (error) {
        req.log.error(
          `Unable to publish delete topic message for: ${subjectId} and ${publicSubjectId}and ARN ${DeleteTopicARN}. Error:${error}`
        );
      }
    }

    req.session.user.state.deleteAccount = getNextState(
      req.session.user.state.deleteAccount.value,
      EventType.ValueUpdated
    );

    await handleLogout(req, res, LogoutState.AccountDeletion);
  };
}
