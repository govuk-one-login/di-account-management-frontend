import { getRequestConfig, Http, http, RequestConfig } from "../../utils/http";
import {
  API_ENDPOINTS,
  ERROR_CODES,
  HTTP_STATUS_CODES,
} from "../../app.constants";
import {
  CheckYourEmailServiceError,
  CheckYourEmailServiceInterface,
} from "./types";
import { AxiosResponse } from "axios";
import { UpdateInformationInput } from "../../utils/types";

export function checkYourEmailService(
  axios: Http = http
): CheckYourEmailServiceInterface {
  const updateEmail = async function (
    updateInput: UpdateInformationInput,
    requestConfig: RequestConfig
  ) {
    const { status, data }: AxiosResponse = await axios.client.post(
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

    let error: CheckYourEmailServiceError.EMAIL_ADDRESS_DENIED | undefined =
      undefined;

    if (data.code === ERROR_CODES.EMAIL_ADDRESS_DENIED) {
      error = CheckYourEmailServiceError.EMAIL_ADDRESS_DENIED;
    }

    return {
      success: status === HTTP_STATUS_CODES.NO_CONTENT,
      error,
    };
  };

  return {
    updateEmail,
  };
}
