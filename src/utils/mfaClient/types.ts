export interface MfaClientInterface {
  retrieve: () => Promise<MfaMethod[]>;
  create: (method: Method) => Promise<MfaMethod>;
  // update: (method: MfaMethod) => MfaMethod;
  // delete: (method: MfaMethod) => void;
}

export interface MfaMethod {
  mfaIdentifier: string;
  priorityIdentifier: PriorityIdentifier;
  method: Method;
  methodVerified: boolean;
}

export interface Method {
  type: string;
}

export interface smsMethod extends Method {
  type: "SMS";
  phoneNumber: string;
}

export interface authAppMethod extends Method {
  mfaMethodType: "AUTH_APP";
  credential: string;
}

export type PriorityIdentifier = "DEFAULT" | "BACKUP";
