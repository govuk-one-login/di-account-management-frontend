import { RequestConfig } from "src/utils/http";
import { ApiResponseResult } from "../../utils/types";

export interface ChangePhoneNumberServiceInterface {
  sendPhoneVerificationNotification: (
    email: string,
    phoneNumber: string,
    requestConfig: RequestConfig
  ) => Promise<ApiResponseResult>;
}
