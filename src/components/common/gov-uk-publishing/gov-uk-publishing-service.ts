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

export function govUkPublishingService(
  axios: Http = new Http(getGovPublishingBaseAPIUrl())
): GovUkPublishingServiceInterface {
  const notifyEmailChanged = async (
    request: GovUkNotificationRequest
  ): Promise<void> => {
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

  function getRequestUrl(subjectId: string) {
    return `${getGovPublishingBaseAPIUrl()}${
      API_ENDPOINTS.ALPHA_GOV_ACCOUNT
    }${subjectId}`;
  }

  return {
    notifyEmailChanged,
  };
}
