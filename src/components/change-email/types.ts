import { RequestConfig } from "../../utils/http.js";

export interface ChangeEmailServiceInterface {
  sendCodeVerificationNotification: (
    email: string,
    requestConfig: RequestConfig
  ) => Promise<boolean>;
}
