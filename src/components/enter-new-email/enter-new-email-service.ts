import { getBaseRequestConfig, Http, http } from "../../utils/http";
import { API_ENDPOINTS, UPDATE_INFO_TYPE } from "../../app.constants";
import { EnterNewEmailServiceInterface, UpdateInfo } from "./types";

export function enterNewEmailService(
  axios: Http = http
): EnterNewEmailServiceInterface {
  const updateEmail = async function (
    accessToken: string,
    existingEmail: string,
    replacementEmail: string
  ): Promise<void> {
    const config = getBaseRequestConfig(accessToken);
    await axios.client.post<UpdateInfo>(
      API_ENDPOINTS.UPDATE_INFO,
      {
        updateInfoType: UPDATE_INFO_TYPE.EMAIL,
        existingProfileAttribute: existingEmail,
        replacementProfileAttribute: replacementEmail,
      },
      config
    );
  };
  return {
    updateEmail,
  };
}
