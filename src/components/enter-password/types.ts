export interface EnterPasswordServiceInterface {
  authenticated: (
    user: { token: string; email: string; password: string },
    sourceIp: string,
    sessionId: string,
    persistentSessionId: string,
    clientSessionId: string,
    txmaAuditEncoded: string
  ) => Promise<{ authenticated: boolean; intervention?: string }>;
}
