import { API_ENDPOINTS } from "../../../app.constants";
import { getRequestConfig, Http } from "../../../utils/http";
import {
  getGovPublishingBaseAPIToken,
  getGovPublishingBaseAPIUrl,
} from "../../../config";
import {
  GovUkPublishingServiceInterface,
  GovUkNotificationRequest,
} from "./types";
import { logger } from "../../../utils/logger";

export function govUkPublishingService(
  axios: Http = new Http(getGovPublishingBaseAPIUrl())
): GovUkPublishingServiceInterface {
  const notifyEmailChanged = async (
    request: GovUkNotificationRequest
  ): Promise<void> => {

    logger.info(`govUkPublishingService notifyEmailChanged - getRequestUrl: ${getRequestUrl(request.publicSubjectId)}`)
    logger.info(`govUkPublishingService notifyEmailChanged - getRequestConfig: ${getRequestConfig(getGovPublishingBaseAPIToken())}`)
    logger.info(`govUkPublishingService notifyEmailChanged - request body: ${JSON.stringify({
      email: request.newEmail,
      email_verified: true,
      has_unconfirmed_email: false,
      legacy_sub: request.legacySubjectId,
    })}`)

    await axios.client.put<void>(
      getRequestUrl(request.publicSubjectId),
      {
        email: request.newEmail,
        email_verified: true,
        has_unconfirmed_email: false,
        legacy_sub: request.legacySubjectId,
      },
      getRequestConfig(getGovPublishingBaseAPIToken())
    );
  };

  const notifyAccountDeleted = async function (
    request: GovUkNotificationRequest
  ): Promise<void> {
    let deleteUrl = getRequestUrl(request.publicSubjectId);

    if (request.legacySubjectId) {
      deleteUrl = deleteUrl + "?legacy_sub=" + request.legacySubjectId;
    }

    logger.info(`govUkPublishingService notifyAccountDeleted - deleteUrl: ${deleteUrl}`)
    logger.info(`govUkPublishingService notifyAccountDeleted - getRequestConfig: ${getRequestConfig(getGovPublishingBaseAPIToken())}`)
 
    await axios.client.delete<void>(
      deleteUrl,
      getRequestConfig(getGovPublishingBaseAPIToken())
    );
  };

  function getRequestUrl(subjectId: string) {
    return `${getGovPublishingBaseAPIUrl()}${
      API_ENDPOINTS.ALPHA_GOV_ACCOUNT
    }${subjectId}`;
  }

  return {
    notifyEmailChanged,
    notifyAccountDeleted,
  };
}
