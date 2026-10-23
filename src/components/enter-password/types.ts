import { RequestConfig } from "../../utils/http.js";

export interface EnterPasswordServiceInterface {
  authenticated: (
    email: string,
    password: string,
    requestConfig: RequestConfig
  ) => Promise<{
    authenticated: boolean;
    hasIntervention?: boolean;
    responseCode?: number;
    responseMessage?: string;
  }>;
}
