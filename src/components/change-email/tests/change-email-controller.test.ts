import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { changeEmailGet, changeEmailPost } from "../change-email-controller";
import { ChangeEmailServiceInterface } from "../types";
import { HTTP_STATUS_CODES } from "../../../app.constants";
import {
  CLIENT_SESSION_ID,
  CURRENT_EMAIL,
  ENGLISH,
  NEW_EMAIL,
  PERSISTENT_SESSION_ID,
  RequestBuilder,
  ResponseBuilder,
  SESSION_ID,
  SOURCE_IP,
  TOKEN,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";
import * as oidcModule from "../../../utils/oidc";

describe("change email controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;
  let fakeService: ChangeEmailServiceInterface;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = new RequestBuilder()
      .withBody({ email: NEW_EMAIL })
      .withTranslate(sandbox.fake())
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder()
      .withRender(sandbox.fake())
      .withRedirect(sandbox.fake(() => {}))
      .withStatus(sandbox.fake())
      .build();

    fakeService = {
      sendCodeVerificationNotification: sandbox.fake.returns(
        true as unknown as Promise<boolean>
      ),
    };
    sandbox.replace(oidcModule, "refreshToken", async () => {});
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("changeEmailGet", () => {
    it("should render enter new email", () => {
      // Act
      changeEmailGet(req as Request, res as Response);

      // Assert
      expect(res.render).to.have.been.calledWith("change-email/index.njk");
    });
  });

  describe("changeEmailPost", () => {
    it("should redirect to /check-your-email on submit", async () => {
      // Act
      await changeEmailPost(fakeService)(req as Request, res as Response);

      // Assert
      expect(fakeService.sendCodeVerificationNotification).calledOnce;
      expect(
        fakeService.sendCodeVerificationNotification
      ).to.have.been.calledWithExactly(NEW_EMAIL, {
        token: TOKEN,
        sourceIp: SOURCE_IP,
        sessionId: SESSION_ID,
        persistentSessionId: PERSISTENT_SESSION_ID,
        userLanguage: ENGLISH,
        clientSessionId: CLIENT_SESSION_ID,
        txmaAuditEncoded: TXMA_AUDIT_ENCODED,
      });
      expect(res.redirect).to.have.calledWith("/check-your-email");
    });

    it("rejects request to change email to existing email address as bad request", async () => {
      // Arrange
      req.body = { email: CURRENT_EMAIL };

      // Act
      await changeEmailPost(fakeService)(req as Request, res as Response);

      // Assert
      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });
  });
});
