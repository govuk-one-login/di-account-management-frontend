import { getRequestConfig, Http, http } from "../../utils/http.js";
import { API_ENDPOINTS, HTTP_STATUS_CODES } from "../../app.constants.js";
import { CheckYourEmailServiceInterface } from "./types.js";
import { AxiosResponse } from "axios";
import {
  UpdateInformationInput,
  UpdateInformationSessionValues,
} from "../../utils/types.js";

export function checkYourEmailService(
  axios: Http = http
): CheckYourEmailServiceInterface {
  const updateEmail = async function (
    updateInput: UpdateInformationInput,
    sessionDetails: UpdateInformationSessionValues
  ): Promise<boolean> {
    const { status }: AxiosResponse = await axios.client.post(
      API_ENDPOINTS.UPDATE_EMAIL,
      {
        existingEmailAddress: updateInput.email,
        replacementEmailAddress: updateInput.updatedValue,
        otp: updateInput.otp,
      },
      getRequestConfig({
        token: sessionDetails.accessToken,
        validationStatuses: [
          HTTP_STATUS_CODES.NO_CONTENT,
          HTTP_STATUS_CODES.BAD_REQUEST,
        ],
        ...sessionDetails,
      })
    );

    return status === HTTP_STATUS_CODES.NO_CONTENT;
  };

  return {
    updateEmail,
  };
}
