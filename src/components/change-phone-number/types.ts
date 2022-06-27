import { ApiResponseResult } from "../../utils/types";

export interface ChangePhoneNumberServiceInterface {
  sendPhoneVerificationNotification: (
    accessToken: string,
    email: string,
    phoneNumber: string,
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string
  ) => Promise<ApiResponseResult>;
}
