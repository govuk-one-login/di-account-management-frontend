import { RequestConfig } from "../../utils/http.js";
import { ApiResponseResult } from "../../utils/types.js";

export interface ChangePhoneNumberServiceInterface {
  sendPhoneVerificationNotification: (
    email: string,
    phoneNumber: string,
    requestConfig: RequestConfig
  ) => Promise<ApiResponseResult>;
}
