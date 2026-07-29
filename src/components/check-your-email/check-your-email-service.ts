import {
  getRequestConfig,
  Http,
  http,
  RequestConfig,
} from "../../utils/http.js";
import {
  API_ENDPOINTS,
  ERROR_CODES,
  HTTP_STATUS_CODES,
} from "../../app.constants.js";
import {
  CheckYourEmailServiceError,
  CheckYourEmailServiceInterface,
} from "./types.js";
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
    const responseData =
      response.status !== HTTP_STATUS_CODES.NO_CONTENT
        ? await response.json()
        : {};

    let error: CheckYourEmailServiceError.EMAIL_ADDRESS_DENIED | undefined =
      undefined;

    if (responseData.code === ERROR_CODES.EMAIL_ADDRESS_DENIED) {
      error = CheckYourEmailServiceError.EMAIL_ADDRESS_DENIED;
    }

    return {
      success: response.status === HTTP_STATUS_CODES.NO_CONTENT,
      error,
    };
  };

  return {
    updateEmail,
  };
}
