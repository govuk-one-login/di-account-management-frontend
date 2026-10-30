import { RequestConfig } from "../../utils/http.js";

export interface EnterPasswordServiceInterface {
  authenticated: (
    email: string,
    password: string,
    requestConfig: RequestConfig
  ) => Promise<{
    success: boolean;
    hasIntervention?: boolean;
    code?: number;
    message?: string;
  }>;
}
