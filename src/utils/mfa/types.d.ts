export type PriorityIdentifier = "DEFAULT" | "BACKUP";

export interface MfaMethod {
  mfaIdentifier?: string;
  priorityIdentifier: PriorityIdentifier;
  method: smsMethod | authAppMethod;
  methodVerified?: boolean;
  smsPhoneNumber?: string;
}
interface smsMethod {
  mfaMethodType: "SMS";
  phoneNumber?: string;
}

interface authAppMethod {
  mfaMethodType: "AUTH_APP";
  credential?: string;
}

export interface ProblemDetail {
  type?: string;
  /** @example MFA Method could not be updated. */
  title?: string;
  status?: string;
  /** @example Database error */
  detail?: string;
  /** @example /mfa-methods/{mfaIdentifier} */
  resource?: string;
  extension?: {
    error?: {
      /** @enum {unknown} */
      code?: 1056 | 1057 | 1058;
    };
  };
}

export interface ValidationProblem {
  type?: string;
  title?: string;
  errors?: Error[];
}

export interface Error {
  detail?: string;
  pointer?: string;
}
