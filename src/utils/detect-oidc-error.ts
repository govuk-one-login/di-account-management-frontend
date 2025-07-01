export type OidcErrorType =
  | 'access_denied'
  | 'invalid_grant'
  | 'id_token_missing'
  | 'state_mismatch'
  | 'unauthorized_response';

export function detectOidcError(
  err: unknown
): { type: OidcErrorType; message: string } | null {
  if (!err) return null;

  const message = typeof err === "string" ? err : (err as any)?.message || "";

  if (message.includes("access_denied")) {
    return { type: "access_denied", message };
  }

  if (message.includes("invalid_grant")) {
    return { type: "invalid_grant", message };
  }

  if (message.includes("id_token") && message.includes("not present")) {
    return { type: "id_token_missing", message };
  }

  if (
    message.includes("state mismatch") ||
    /expected.*state.*got:/i.test(message)
  ) {
    return { type: "state_mismatch", message };
  }

  if (message.includes("200 OK, got: 401 Unauthorized")) {
    return { type: "unauthorized_response", message };
  }

  return null;
}
