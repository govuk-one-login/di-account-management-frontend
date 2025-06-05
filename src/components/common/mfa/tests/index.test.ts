import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../../test/utils/test-utils";
import { Request, Response } from "express";
import * as mfaModule from "../../../../utils/mfa";
import QRCode from "qrcode";
import { renderMfaMethodPage } from "../index";
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
      backLink: undefined,
      errors: {},
      errorList: [],
      oplValues: undefined,
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
      backLink: undefined,
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
      oplValues: undefined,
    });
  });

  it("should pass the supplied backlink through to the template", async () => {
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
          state: { changeAuthenticatorApp: ["VALUE_UPDATED"] },
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
      undefined,
      "backlink",
      {
        contentId: "contentId",
        taxonomyLevel2: "taxonomyLevel2",
        taxonomyLevel3: "taxonomyLevel3",
      }
    );

    expect(res.render).to.have.been.calledWith(templateFilePath, {
      authAppSecret: "A".repeat(20),
      qrCode: await QRCode.toDataURL("qrcode"),
      formattedSecret: "AAAA AAAA AAAA AAAA AAAA",
      errors: undefined,
      errorList: undefined,
      backLink: "backlink",
      oplValues: {
        contentId: "contentId",
        taxonomyLevel2: "taxonomyLevel2",
        taxonomyLevel3: "taxonomyLevel3",
      },
    });
  });
});
