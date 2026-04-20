import { RequestConfig } from "../../utils/http.js";
import { PriorityIdentifier } from "../../utils/mfaClient/types.js";
import { ApiResponseResult } from "../../utils/types.js";

export interface ChangePhoneNumberServiceInterface {
  sendPhoneVerificationNotification: (
    email: string,
    phoneNumber: string,
    priorityIdentifier: PriorityIdentifier,
    requestConfig: RequestConfig
  ) => Promise<ApiResponseResult>;
}
