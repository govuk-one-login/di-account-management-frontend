export interface MfaClientInterface {
  retrieve: () => Promise<ApiResponse<MfaMethod[]>>;
  create: (
    method: SmsMethod | AuthAppMethod,
    otp?: string
  ) => Promise<ApiResponse<MfaMethod>>;
  update: (
    method: MfaMethod,
    otp?: string
  ) => Promise<ApiResponse<MfaMethod[]>>;
  delete: (method: MfaMethod) => Promise<ApiResponse<any>>;
  makeDefault: (mfaIdentifier: string) => Promise<ApiResponse<MfaMethod[]>>;
}

export interface MfaMethod {
  mfaIdentifier: string;
  priorityIdentifier: PriorityIdentifier;
  method: SmsMethod | AuthAppMethod;
  methodVerified?: boolean;
}

export const mfaMethodTypes = {
  authApp: "AUTH_APP",
  sms: "SMS",
} as const;

export interface SmsMethod {
  mfaMethodType: typeof mfaMethodTypes.sms;
  phoneNumber: string;
}

export interface AuthAppMethod {
  mfaMethodType: typeof mfaMethodTypes.authApp;
  credential: string;
}

export const mfaPriorityIdentifiers = {
  default: "DEFAULT",
  backup: "BACKUP",
} as const;

export type PriorityIdentifier =
  (typeof mfaPriorityIdentifiers)[keyof typeof mfaPriorityIdentifiers];

export interface ApiResponse<T> {
  success: boolean;
  status: number;
  data: T;
  error?: SimpleError;
}

export interface CreateMfaPayload {
  priorityIdentifier: PriorityIdentifier;
  method: (SmsMethod | AuthAppMethod) & { otp?: string };
}

export interface UpdateMfaPayload {
  mfaIdentifier: string;
  priorityIdentifier: PriorityIdentifier;
  method: (SmsMethod | AuthAppMethod) & { otp?: string };
  methodVerified?: boolean;
}

export interface SimpleError {
  code: number;
  message: string;
}
