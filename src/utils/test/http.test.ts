import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../test/utils/test-utils";
import { Request, Response } from "express";
import { RequestBuilder, ResponseBuilder } from "../../../test/utils/builders";
import { getRequestConfigFromExpress } from "../http";
import * as oidcModule from "../oidc";

describe("getRequestConfigFromExpress", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = new RequestBuilder().build();
    res = new ResponseBuilder().build();
    sandbox.replace(oidcModule, "refreshToken", async () => {});
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("returns the expected request config", async () => {
    req.session.user.tokens = { accessToken: "token" } as any;

    const requestConfig = await getRequestConfigFromExpress(
      req as Request,
      res as Response
    );

    expect(requestConfig).to.deep.eq({
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
