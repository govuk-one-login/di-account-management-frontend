import { RequestConfig } from "../../utils/http";

export interface ChangeEmailServiceInterface {
  sendCodeVerificationNotification: (
    email: string,
    requestConfig: RequestConfig
  ) => Promise<boolean>;
}
