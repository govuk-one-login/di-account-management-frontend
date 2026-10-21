import {
  getRequestConfig,
  Http,
  http,
  RequestConfig,
} from "../../utils/http.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants.js";
import { CheckYourEmailServiceInterface } from "./types.js";
import { UpdateInformationInput } from "../../utils/types.js";

export function checkYourEmailService(
  fetchClient: Http = http
): CheckYourEmailServiceInterface {
  const updateEmail = async function (
    updateInput: UpdateInformationInput,
    requestConfig: RequestConfig
  ) {
    const response = await fetchClient.post(
      API_ENDPOINTS.UPDATE_EMAIL,
      {
        existingEmailAddress: updateInput.email,
        replacementEmailAddress: updateInput.updatedValue,
        otp: updateInput.otp,
      },
      getRequestConfig({
        ...requestConfig,
        validationStatuses: [
          HTTP_STATUS_CODES.NO_CONTENT,
          HTTP_STATUS_CODES.BAD_REQUEST,
          HTTP_STATUS_CODES.FORBIDDEN,
        ],
      })
    );

    if (response.status === HTTP_STATUS_CODES.NO_CONTENT) {
      return { success: true };
    } else {
      const data = await response.json();

      return {
        success: false,
        responseCode: data.code,
        responseMessage: data.message,
      };
    }
  };

  return {
    updateEmail,
  };
}
