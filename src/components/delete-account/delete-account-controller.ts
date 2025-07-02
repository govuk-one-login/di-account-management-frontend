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
import { handleLogout } from "../../utils/logout";
import { LogoutState } from "../../app.constants";
import { getRequestConfigFromExpress } from "../../utils/http";
import {
  DELETE_ACCOUNT_COMMON_OPL_SETTINGS,
  setOplSettings,
} from "../../utils/opl";
import { MetricUnit } from "@aws-lambda-powertools/metrics";

export async function deleteAccountGet(
  req: Request,
  res: Response
): Promise<void> {
  req.metrics?.addMetric("deleteAccountGet", MetricUnit.Count, 1);
  setOplSettings(
    {
      ...DELETE_ACCOUNT_COMMON_OPL_SETTINGS,
      contentId: "7c0ae794-46ba-4abd-bf23-ebd70782a96b",
    },
    res
  );

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

    if (services.length) {
      setOplSettings(
        {
          ...DELETE_ACCOUNT_COMMON_OPL_SETTINGS,
          contentId: "0768fa94-3a7a-4f19-8bf5-a1d5afa49023",
        },
        res
      );
    }

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
    req.metrics?.addMetric("deleteAccountPost", MetricUnit.Count, 1);
    const { email, subjectId, publicSubjectId, legacySubjectId } =
      req.session.user;

    const deleteAccount = await service.deleteAccount(
      email,
      getRequestConfigFromExpress(req, res)
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
        req.metrics?.addMetric("deleteAccountPostError", MetricUnit.Count, 1);
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
