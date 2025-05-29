import { RequestConfig } from "src/utils/http";

export interface ChangeEmailServiceInterface {
  sendCodeVerificationNotification: (
    email: string,
    requestConfig: RequestConfig
  ) => Promise<boolean>;
}
