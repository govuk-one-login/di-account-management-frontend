import { expect } from "chai";
import sinon from "sinon";
import { describe } from "mocha";
import {
  attachSessionIdsFromGsCookie,
  handleOidcCallbackError,
  populateSessionWithUserInfo,
} from "../call-back-helper";
import { logger } from "../../../utils/logger";
import * as sessionStore from "../../../utils/session-store";
import { PATH_DATA } from "../../../app.constants";

describe("callback.helpers", () => {
  afterEach(() => {
    sinon.restore();
  });

  describe("handleOidcCallbackError", () => {
    it("clears session and redirects to SESSION_EXPIRED", async () => {
      const deleteExpressSessionStub = sinon.stub(
        sessionStore,
        "deleteExpressSession"
      );
      const loggerWarnStub = sinon.stub(logger, "warn");

      const req: any = { session: {}, oidc: {}, cookies: {} };
      const res: any = {
        locals: { trace: "trace-id" },
        redirect: sinon.fake(),
      };
      const queryParams = {
        error: "access_denied",
        error_description: "User denied access",
      };

      await handleOidcCallbackError(req, res, queryParams);

      expect(loggerWarnStub.calledOnce).to.be.true;
      expect(deleteExpressSessionStub.calledWith(req)).to.be.true;
      expect(res.redirect.calledWith(PATH_DATA.SESSION_EXPIRED.url)).to.be.true;
    });
  });

  describe("populateSessionWithUserInfo", () => {
    it("stores user info and tokens in session", () => {
      const req: any = {
        session: {},
      };
      const res: any = {
        locals: {},
      };

      const userInfo = {
        email: "user@example.com",
        phone_number: "1234567890",
        phone_number_verified: true,
        sub: "subject123",
        legacy_subject_id: "legacy123",
        public_subject_id: "public123",
      };

      const tokenSet = {
        id_token: "id.token",
        access_token: "access.token",
        refresh_token: "refresh.token",
      };

      populateSessionWithUserInfo(req, res, userInfo as any, tokenSet as any);

      expect(req.session.user.email).to.equal("user@example.com");
      expect(req.session.user.tokens.accessToken).to.equal("access.token");
      expect(req.session.user.legacySubjectId).to.equal("legacy123");
      expect(res.locals.isUserLoggedIn).to.be.true;
      expect(req.session.user_id).to.equal("subject123");
    });
  });

  describe("attachSessionIdsFromGsCookie", () => {
    it("logs warning if gs cookie is malformed", () => {
      const loggerInfo = sinon.stub(logger, "info");
      const loggerError = sinon.stub(logger, "error");

      const req: any = {
        cookies: {
          gs: "malformed-cookie",
        },
        session: {},
      };

      const res: any = {
        locals: { trace: "abc123" },
      };

      attachSessionIdsFromGsCookie(req, res);

      expect(loggerInfo.called).to.be.true;
      expect(loggerError.calledOnce).to.be.true;
      expect(req.session.authSessionIds).to.be.undefined;
    });

    it("sets session.authSessionIds when cookie is valid", () => {
      const loggerInfo = sinon.stub(logger, "info");
      const req: any = {
        cookies: {
          gs: "sess123.client456",
        },
        session: {},
      };

      const res: any = {
        locals: { trace: "trace-xyz" },
      };

      attachSessionIdsFromGsCookie(req, res);

      expect(loggerInfo.calledOnce).to.be.true;
      expect(req.session.authSessionIds).to.deep.equal({
        sessionId: "sess123",
        clientSessionId: "client456",
      });
    });

    it("logs info if gs cookie is missing", () => {
      const loggerInfo = sinon.stub(logger, "info");

      const req: any = {
        cookies: {},
        session: {},
      };
      const res: any = {
        locals: { trace: "trace-abc" },
      };

      attachSessionIdsFromGsCookie(req, res);

      expect(loggerInfo.calledOnce).to.be.true;
    });
  });
});
