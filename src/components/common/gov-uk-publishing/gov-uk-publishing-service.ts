import { API_ENDPOINTS } from "../../../app.constants.js";
import { getRequestConfig, Http } from "../../../utils/http.js";
import {
  getGovPublishingBaseAPIToken,
  getGovPublishingBaseAPIUrl,
} from "../../../config.js";
import {
  GovUkPublishingServiceInterface,
  GovUkNotificationRequest,
} from "./types.js";

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
      getRequestConfig({
        token: getGovPublishingBaseAPIToken(),
      })
    );
  };

  const notifyAccountDeleted = async function (
    request: GovUkNotificationRequest
  ): Promise<void> {
    let deleteUrl = getRequestUrl(request.publicSubjectId);

    if (request.legacySubjectId) {
      deleteUrl = deleteUrl + "?legacy_sub=" + request.legacySubjectId;
    }

    await axios.client.delete<void>(
      deleteUrl,
      getRequestConfig({ token: getGovPublishingBaseAPIToken() })
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
