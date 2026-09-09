import { RequestConfig } from "../../utils/http.js";

export interface DeleteAccountServiceInterface {
  deleteAccount: (
    email: string,
    requestConfig: RequestConfig
  ) => Promise<boolean>;
}
