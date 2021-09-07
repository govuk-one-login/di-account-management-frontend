import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  deleteAccountGet,
  deleteAccountPost,
} from "../delete-account-controller";
import { DeleteAccountServiceInterface } from "../types";
import { PATH_DATA } from "../../../app.constants";

describe("delete account controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = { body: {}, session: { user: { state: { deleteAccount: {} } } } };
    res = { render: sandbox.fake(), redirect: sandbox.fake(), locals: {} };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("deleteAccountGet", () => {
    it("should render delete account page", () => {
      deleteAccountGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("delete-account/index.njk");
    });
  });

  describe("deleteAccountPost", () => {
    it("should redirect to deletion confirmed page", async () => {
      const fakeService: DeleteAccountServiceInterface = {
        deleteAccount: sandbox.fake(),
      };

      req.session.user.email = "test@test.com";
      req.session.user.accessToken = "accessToken";

      await deleteAccountPost(fakeService)(req as Request, res as Response);

      expect(fakeService.deleteAccount).to.have.been.calledOnce;
      expect(res.redirect).to.have.been.calledWith(
        PATH_DATA.ACCOUNT_DELETED_CONFIRMATION.url
      );
    });
  });
});
