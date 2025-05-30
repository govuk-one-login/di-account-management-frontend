import { getRequestConfig, Http, http, RequestConfig } from "../../utils/http";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants";
import { CheckYourEmailServiceInterface } from "./types";
import { AxiosResponse } from "axios";
import { UpdateInformationInput } from "../../utils/types";

export function checkYourEmailService(
  axios: Http = http
): CheckYourEmailServiceInterface {
  const updateEmail = async function (
    updateInput: UpdateInformationInput,
    requestConfig: RequestConfig
  ): Promise<boolean> {
    const { status }: AxiosResponse = await axios.client.post(
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
        ],
      })
    );

    return status === HTTP_STATUS_CODES.NO_CONTENT;
  };

  return {
    updateEmail,
  };
}
