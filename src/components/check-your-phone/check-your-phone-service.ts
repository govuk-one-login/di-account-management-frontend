import { getRequestConfig, Http, http, RequestConfig } from "../../utils/http";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants";
import { CheckYourPhoneServiceInterface } from "./types";
import { UpdateInformationInput } from "../../utils/types";

export function checkYourPhoneService(
  axios: Http = http
): CheckYourPhoneServiceInterface {
  const updatePhoneNumber = async function (
    updateInput: UpdateInformationInput,
    requestConfig: RequestConfig
  ): Promise<boolean> {
    const { status } = await axios.client.post<void>(
      API_ENDPOINTS.UPDATE_PHONE_NUMBER,
      {
        email: updateInput.email,
        phoneNumber: updateInput.updatedValue,
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
    updatePhoneNumber,
  };
}
