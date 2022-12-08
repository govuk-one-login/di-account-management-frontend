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
  // eslint-disable-next-line no-console
  console.log("govUkPublishingService - line 17")
  const notifyEmailChanged = async (
    request: GovUkNotificationRequest
  ): Promise<void> => {
    // eslint-disable-next-line no-console
    console.log("getRequestUrl - line 21", getRequestUrl(request.publicSubjectId))
    // eslint-disable-next-line no-console
    console.log("getRequestConfig - line 22", getRequestConfig(getGovPublishingBaseAPIToken()))
    // eslint-disable-next-line no-console
    console.log("govUkPublishingService - line 25 - request body:", {
      email: request.newEmail,
      email_verified: true,
      has_unconfirmed_email: false,
      legacy_sub: request.legacySubjectId,
    })

    const response = await axios.client.put<void>(
      getRequestUrl(request.publicSubjectId),
      {
        email: request.newEmail,
        email_verified: true,
        has_unconfirmed_email: false,
        legacy_sub: request.legacySubjectId,
      },
      getRequestConfig(getGovPublishingBaseAPIToken())
    );
    // eslint-disable-next-line no-console
    console.log("Response from mock on PUT:", response)
  };

  const notifyAccountDeleted = async function (
    request: GovUkNotificationRequest
  ): Promise<void> {
    let deleteUrl = getRequestUrl(request.publicSubjectId);
    // eslint-disable-next-line no-console
    console.log("notifyAccountDeleted - line 39 - deleteUrl", deleteUrl)


    if (request.legacySubjectId) {
      deleteUrl = deleteUrl + "?legacy_sub=" + request.legacySubjectId;
    }
    // eslint-disable-next-line no-console
    console.log("notifyAccountDeleted - line 58 - deleteUrl for legacySubjectId", deleteUrl)
    
    const response = await axios.client.delete<void>(
      deleteUrl,
      getRequestConfig(getGovPublishingBaseAPIToken())
    );
    // eslint-disable-next-line no-console
    console.log("Response from mock on DELETE:", response)
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
