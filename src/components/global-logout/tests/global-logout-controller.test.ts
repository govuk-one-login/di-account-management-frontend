import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { HTTP_STATUS_CODES } from "../../../app.constants";
import { globalLogoutPost } from "../global-logout-controller";

describe("global logout controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    const oidc = require("../../../utils/oidc");
    sandbox.stub(oidc, "getOIDCClient").callsFake(() => {
      return new Promise((resolve) => {
        resolve({
          endSessionUrl: function (params: any = {}) {
            return `${process.env.API_BASE_URL}/logout?id_token_hint=${
              params.id_token_hint
            }&post_logout_redirect_uri=${encodeURIComponent(
              params.post_logout_redirect_uri
            )}`;
          },
        });
      });
    });

    res = {
      status: sandbox.stub().returnsThis(),
      send: sandbox.fake(),
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("globalLogoutPost", async () => {
    it("should return 401 if no logout_token present", async () => {
      req = {
        body: {},
      };
      await globalLogoutPost(req as Request, res as Response);

      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
    });

    it("should return 401 if no logout_token not a signed JWT", async () => {
      req = {
        body: {
          logout_token: "zzzzzzzz"
        },
        log: { error: sandbox.fake() }
      };
      await globalLogoutPost(req as Request, res as Response)

      expect(res.status).to.have.been.calledWith(HTTP_STATUS_CODES.UNAUTHORIZED);
      expect(req.log.error).to.have.been.called;
    });
  });
});
