import { RequestConfig } from "../../utils/http.js";
import { ApiResponseResult } from "../../utils/types.js";

export interface ChangePasswordServiceInterface {
  updatePassword: (
    email: string,
    newPassword: string,
    requestConfig: RequestConfig
  ) => Promise<ApiResponseResult>;
}
