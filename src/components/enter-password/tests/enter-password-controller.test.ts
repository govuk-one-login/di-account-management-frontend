import { expect } from "chai";
import { describe } from "mocha";
import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import {
  enterPasswordGet,
  enterPasswordPost,
} from "../enter-password-controller";
import { EnterPasswordServiceInterface } from "../types";
import { HTTP_STATUS_CODES, PATH_DATA } from "../../../app.constants";
import { TXMA_AUDIT_ENCODED } from "../../../../test/utils/builders";
import * as logout from "../../../utils/logout";
import { UserJourney } from "../../../utils/state-machine";
import * as oidcModule from "../../../utils/oidc";

describe("enter password controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      cookies: {},
      session: {
        user: {
          state: {
            changePassword: {},
            changePhoneNumber: {},
            changeEmail: {},
            deleteAccount: {},
          },
        },
      } as any,
      t: sandbox.fake(),
      i18n: { language: "en" },
      query: {},
      headers: { "txma-audit-encoded": TXMA_AUDIT_ENCODED },
    };
    res = {
      render: sandbox.fake(),
      redirect: sandbox.fake(() => {}),
      status: sandbox.fake(),
      locals: {},
    };
    sandbox.replace(oidcModule, "refreshToken", async () => {});
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("enterPasswordGet", () => {
    it("should render enter password view with query param", async () => {
      req.query.type = "changePassword";

      await enterPasswordGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("enter-password/index.njk");
    });

    it("should redirect to security when there is no 'type' query parameter", async () => {
      await enterPasswordGet(req as Request, res as Response);

      expect(res.render).not.to.have.been.called;
      expect(res.redirect).to.have.calledWith(PATH_DATA.SETTINGS.url);
    });

    it("should send an AUTH_MFA_METHOD_ADD_STARTED audit event when journey type is addBackup", async () => {
      req.query.type = UserJourney.addBackup;

      const mockEventService = {
        buildAuditEvent: sandbox.fake.returns({ event: "test-event" }),
        send: sandbox.fake(),
      };

      const eventServiceStub = sandbox.stub().returns(mockEventService);

      const eventServiceModule = await import(
        "../../../services/event-service"
      );
      sandbox
        .stub(eventServiceModule, "eventService")
        .get(() => eventServiceStub);

      await enterPasswordGet(req as Request, res as Response);

      expect(mockEventService.buildAuditEvent).to.have.been.calledWith(
        req,
        res,
        "AUTH_MFA_METHOD_ADD_STARTED"
      );
      expect(mockEventService.send).to.have.been.calledOnce;
      expect(res.render).to.have.calledWith("enter-password/index.njk");
    });

    it("should send an AUTH_MFA_METHOD_SWITCH_STARTED audit event when journey type is SwitchBackupMethod", async () => {
      req.query.type = UserJourney.SwitchBackupMethod;

      const mockEventService = {
        buildAuditEvent: sandbox.fake.returns({ event: "test-event" }),
        send: sandbox.fake(),
      };

      const eventServiceStub = sandbox.stub().returns(mockEventService);

      const eventServiceModule = await import(
        "../../../services/event-service"
      );
      sandbox
        .stub(eventServiceModule, "eventService")
        .get(() => eventServiceStub);

      await enterPasswordGet(req as Request, res as Response);

      expect(mockEventService.buildAuditEvent).to.have.been.calledWith(
        req,
        res,
        "AUTH_MFA_METHOD_SWITCH_STARTED"
      );
      expect(mockEventService.send).to.have.been.calledOnce;
      expect(res.render).to.have.calledWith("enter-password/index.njk");
    });

    it("should send an AUTH_MFA_METHOD_DELETE_STARTED audit event when journey type is RemoveBackup", async () => {
      req.query.type = UserJourney.RemoveBackup;

      const mockEventService = {
        buildAuditEvent: sandbox.fake.returns({ event: "test-event" }),
        send: sandbox.fake(),
      };

      const eventServiceStub = sandbox.stub().returns(mockEventService);

      const eventServiceModule = await import(
        "../../../services/event-service"
      );
      sandbox
        .stub(eventServiceModule, "eventService")
        .get(() => eventServiceStub);

      await enterPasswordGet(req as Request, res as Response);

      expect(mockEventService.buildAuditEvent).to.have.been.calledWith(
        req,
        res,
        "AUTH_MFA_METHOD_DELETE_STARTED"
      );
      expect(mockEventService.send).to.have.been.calledOnce;
      expect(res.render).to.have.calledWith("enter-password/index.njk");
    });

    it("should not send an audit event when journey type is change password", async () => {
      req.query.type = UserJourney.ChangePassword;

      const mockEventService = {
        buildAuditEvent: sandbox.fake.returns({ event: "test-event" }),
        send: sandbox.fake(),
      };

      const eventServiceStub = sandbox.stub().returns(mockEventService);

      const eventServiceModule = await import(
        "../../../services/event-service"
      );
      sandbox
        .stub(eventServiceModule, "eventService")
        .get(() => eventServiceStub);

      await enterPasswordGet(req as Request, res as Response);
      expect(mockEventService.send).not.to.have.been.called;
      expect(res.render).to.have.calledWith("enter-password/index.njk");
    });
  });

  describe("enterPasswordPost", () => {
    it("should redirect to security when there is no 'type' query parameter in enter password post", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.resolves({ authenticated: true }),
      };

      req.body["password"] = "password";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.render).not.to.have.been.called;
      expect(res.redirect).to.have.calledWith(PATH_DATA.SETTINGS.url);
    });

    it("should redirect to change-email when the password is correct", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.resolves({ authenticated: true }),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        state: { changeEmail: { value: "CHANGE_VALUE" } },
        tokens: { accessToken: "token" },
      } as any;

      req.body["password"] = "password";
      req.query["type"] = "changeEmail";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.redirect).to.have.calledWith(PATH_DATA.CHANGE_EMAIL.url);
    });

    it("should bad request when user doesn't enter a password", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.resolves({ authenticated: true }),
      };

      req.body["password"] = "";
      req.query["type"] = "changeEmail";
      req.query["from"] = "security";
      req.query["edit"] = "true";
      req.url =
        "https://test.com/enter-password?from=security&edit=true&type=changeEmail";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(fakeService.authenticated).not.to.have.been.called;
      expect(res.render).to.have.been.called;
      expect(res.render).to.have.been.calledWith("enter-password/index.njk", {
        requestType: "changeEmail",
        fromSecurity: true,
        formAction:
          "https://test.com/enter-password?from=security&edit=true&type=changeEmail",
        errors: { password: { text: undefined, href: "#password" } },
        errorList: [{ text: undefined, href: "#password" }],
        language: "en",
        password: "",
      });
      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should bad request when user credentials are incorrect", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.resolves({ authenticated: false }),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        tokens: { accessToken: "token" },
      } as any;

      req.body["password"] = "password";
      req.query["type"] = "changeEmail";
      req.query["edit"] = "true";
      req.url = "https://test.com/enter-password?edit=true&type=changeEmail";

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(res.render).to.have.been.called;
      expect(res.render).to.have.been.calledWith("enter-password/index.njk", {
        requestType: "changeEmail",
        fromSecurity: false,
        formAction:
          "https://test.com/enter-password?edit=true&type=changeEmail",
        errors: { password: { text: undefined, href: "#password" } },
        errorList: [{ text: undefined, href: "#password" }],
        language: "en",
        password: "password",
      });
      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.BAD_REQUEST);
    });

    it("should logout and redirect to permanently suspended when intervention is BLOCKED", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.resolves({
          authenticated: false,
          intervention: "BLOCKED",
        }),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        tokens: { accessToken: "token" },
        state: { changeEmail: { value: "CHANGE_VALUE" } },
      } as any;

      req.body["password"] = "password";
      req.query["type"] = "changeEmail";

      const handleLogoutStub = sandbox.stub(logout, "handleLogout");

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(handleLogoutStub).to.have.been.calledWith(req, res, "blocked");
    });

    it("should logout and redirect to unavailable temporary when intervention is SUSPENDED", async () => {
      const fakeService: EnterPasswordServiceInterface = {
        authenticated: sandbox.fake.resolves({
          authenticated: false,
          intervention: "SUSPENDED",
        }),
      };

      req.session.user = {
        email: "test@test.com",
        phoneNumber: "xxxxxxx7898",
        tokens: { accessToken: "token" },
        state: { changeEmail: { value: "CHANGE_VALUE" } },
      } as any;

      req.body["password"] = "password";
      req.query["type"] = "changeEmail";

      const handleLogoutStub = sandbox.stub(logout, "handleLogout");

      await enterPasswordPost(fakeService)(req as Request, res as Response);

      expect(handleLogoutStub).to.have.been.calledWith(req, res, "suspended");
    });
  });
});
