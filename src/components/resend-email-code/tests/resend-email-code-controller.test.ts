import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  resendEmailCodeGet,
  resendEmailCodePost,
} from "../resend-email-code-controller";
import { ChangeEmailServiceInterface } from "../../change-email/types";
import { getInitialState } from "../../../utils/state-machine";
import {
  ENGLISH,
  NEW_EMAIL,
  ORIGINAL_URL,
  RequestBuilder,
} from "../../../../test/utils/builders";

describe("check your email controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: { user: {} } as any,
      cookies: { lng: "en" },
      i18n: { language: "en" },
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      status: sandbox.fake(),
      locals: {},
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("resendEmailCodeGet", () => {
    it("should render resend email code view", () => {
      // Arrange
      req = new RequestBuilder().build();

      // Act
      resendEmailCodeGet(req as Request, res as Response);

      // Assert
      expect(res.render).to.have.calledWith("resend-email-code/index.njk", {
        emailAddress: NEW_EMAIL,
        language: ENGLISH,
        currentUrl: ORIGINAL_URL,
        baseUrl: "https://www.gov.uk",
      });
    });
  });

  describe("resendEmailCodePost", () => {
    it("should redirect to /check-your-email when get security code is executed", async () => {
      const fakeService: ChangeEmailServiceInterface = {
        sendCodeVerificationNotification: sandbox.fake.resolves(true),
      };

      req.session.user = {
        tokens: { accessToken: "token" },
        email: "test@dl.com",
        newEmailAddress: "test@test.com",
        state: { changeEmail: getInitialState() },
      } as any;
      req.cookies.lng = "en";

      await resendEmailCodePost(fakeService)(req as Request, res as Response);

      expect(fakeService.sendCodeVerificationNotification).to.have.been
        .calledOnce;
      expect(res.redirect).to.have.calledWith("/check-your-email");
    });
  });
});
