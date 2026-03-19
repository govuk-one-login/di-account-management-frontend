import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Request, Response } from "express";
import { RequestBuilder, ResponseBuilder } from "../../../test/utils/builders";
import { getRequestConfigFromExpress } from "../http.js";
import * as oidcModule from "../oidc.js";

describe("getRequestConfigFromExpress", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    req = new RequestBuilder().build();
    res = new ResponseBuilder().build();
    vi.spyOn(oidcModule, "refreshToken").mockImplementation(async () => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the expected request config", async () => {
    req.session.user.tokens = { accessToken: "token" } as any;

    const requestConfig = await getRequestConfigFromExpress(
      req as Request,
      res as Response
    );

    expect(requestConfig).toEqual({
      token: "token",
      clientSessionId: "clientsessionid",
      persistentSessionId: "persistentsessionid",
      sessionId: "sessionid",
      sourceIp: "sourceip",
      txmaAuditEncoded: "txma-audit-encoded",
      userLanguage: "en",
    });
  });
});
