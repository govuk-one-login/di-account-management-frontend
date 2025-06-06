import { RequestConfig } from "../../utils/http";

export interface EnterPasswordServiceInterface {
  authenticated: (
    email: string,
    password: string,
    requestConfig: RequestConfig
  ) => Promise<{ authenticated: boolean; intervention?: string }>;
}
