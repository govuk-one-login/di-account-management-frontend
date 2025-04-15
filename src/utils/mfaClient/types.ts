import { ProblemDetail, ValidationProblem } from "../mfa/types";

export interface MfaClientInterface {
  retrieve: () => Promise<ApiResponse<MfaMethod[]>>;
  create: (
    method: SmsMethod | AuthAppMethod,
    otp?: string
  ) => Promise<ApiResponse<MfaMethod>>;
  update: (method: MfaMethod) => Promise<ApiResponse<MfaMethod[]>>;
  delete: (method: MfaMethod) => Promise<ApiResponse<any>>;
  makeDefault: (method: MfaMethod) => Promise<ApiResponse<MfaMethod[]>>;
}

export interface MfaMethod {
  mfaIdentifier: string;
  priorityIdentifier: PriorityIdentifier;
  method: SmsMethod | AuthAppMethod;
  methodVerified: boolean;
}

export interface SmsMethod {
  mfaMethodType: "SMS";
  phoneNumber: string;
}

export interface AuthAppMethod {
  mfaMethodType: "AUTH_APP";
  credential: string;
}

export type PriorityIdentifier = "DEFAULT" | "BACKUP";

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  data: T;
  problem?: ValidationProblem | ProblemDetail;
}

export interface CreateMfaPayload {
  priorityIdentifier: PriorityIdentifier;
  mfaMethod: SmsMethod | AuthAppMethod;
  otp?: string;
}
