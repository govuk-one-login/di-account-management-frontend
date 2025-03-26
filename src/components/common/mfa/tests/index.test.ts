import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../../test/utils/test-utils";
import { Request, Response } from "express";
import * as mfaModule from "../../../../utils/mfa";
import QRCode from "qrcode";
import { generateSessionDetails, renderMfaMethodPage } from "../index";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../../test/utils/builders";
import { formatValidationError } from "../../../../utils/validation";

describe("render mfa page", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should render mfa page", async () => {
    const req = {
      body: {
        code: "qrcode",
        authAppSecret: "A".repeat(20),
      },
      session: {
        id: "session_id",
        user: {
          email: "test@test.com",
          tokens: { accessToken: "token" },
          state: { changeAuthApp: ["VALUE_UPDATED"] },
        },
      },
      log: { error: sinon.fake() },
      ip: "127.0.0.1",
      t: (t: string) => t,
    };
    const res = {
      locals: {
        persistentSessionId: "persistentSessionId",
      },
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
    };
    const next = sinon.spy();

    sandbox.replace(mfaModule, "generateMfaSecret", () => "A".repeat(20));
    sandbox.replace(mfaModule, "generateQRCodeValue", () => "qrcode");
    const templateFilePath = "abc.njk";
    await renderMfaMethodPage(
      templateFilePath,
      req as unknown as Request,
      res as unknown as Response,
      next,
      {}
    );

    expect(res.render).to.have.been.calledWith(templateFilePath, {
      authAppSecret: "A".repeat(20),
      qrCode: await QRCode.toDataURL("qrcode"),
      formattedSecret: "AAAA AAAA AAAA AAAA AAAA",
      errors: {},
      errorList: [],
    });
  });

  it("should render mfa page with error", async () => {
    const req = {
      body: {
        code: "qrcode",
        authAppSecret: "A".repeat(20),
      },
      session: {
        id: "session_id",
        user: {
          email: "test@test.com",
          tokens: { accessToken: "token" },
          state: { changeAuthApp: ["VALUE_UPDATED"] },
        },
      },
      log: { error: sinon.fake() },
      ip: "127.0.0.1",
      t: (t: string) => t,
    };
    const res = {
      locals: {
        persistentSessionId: "persistentSessionId",
      },
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
    };
    const next = sinon.spy();

    sandbox.replace(mfaModule, "generateMfaSecret", () => "A".repeat(20));
    sandbox.replace(mfaModule, "generateQRCodeValue", () => "qrcode");
    const templateFilePath = "abc.njk";
    await renderMfaMethodPage(
      templateFilePath,
      req as unknown as Request,
      res as unknown as Response,
      next,
      formatValidationError(
        "code",
        req.t("pages.renderUpdateAuthAppPage.errors.maxLength")
      )
    );

    expect(res.render).to.have.been.calledWith(templateFilePath, {
      authAppSecret: "A".repeat(20),
      qrCode: await QRCode.toDataURL("qrcode"),
      formattedSecret: "AAAA AAAA AAAA AAAA AAAA",
      errors: {
        code: {
          text: "pages.renderUpdateAuthAppPage.errors.maxLength",
          href: "#code",
        },
      },
      errorList: [
        {
          text: "pages.renderUpdateAuthAppPage.errors.maxLength",
          href: "#code",
        },
      ],
    });
  });
});

describe("generate input fields", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ changeAuthenticatorApp: {} })
      .withTimestampT(sandbox.fake())
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder()
      .withRender(sandbox.fake())
      .withRedirect(sandbox.fake(() => {}))
      .withStatus(sandbox.fake())
      .build();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("should generate session details", async () => {
    // Arrange
    req.session.user.tokens = { accessToken: "token" } as any;

    const expected = {
      accessToken: "token",
      clientSessionId: "clientsessionid",
      persistentSessionId: "persistentsessionid",
      sessionId: "sessionid",
      sourceIp: "sourceip",
      txmaAuditEncoded: "txma-audit-encoded",
      userLanguage: "en",
    };
    const actual = await generateSessionDetails(req, res);
    // Assert
    expect(actual).to.be.deep.equal(expected);
  });
});
