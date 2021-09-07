import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  deleteAccountGet,
  deleteAccountPost,
} from "../delete-account-controller";
import { DeleteAccountServiceInterface } from "../types";

describe("delete account controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = { body: {}, session: { user: {} } };
    res = { render: sandbox.fake(), redirect: sandbox.fake(), locals: {} };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("deleteAccountGet", () => {
    it("should render delete account index", () => {
      deleteAccountGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("delete-account/index.njk");
    });
  });

  describe("deleteAccountPost", () => {
    it("should render confirmed index", async () => {
      const fakeService: DeleteAccountServiceInterface = {
        deleteAccount: sandbox.fake(),
      };

      req.session.user = {
        email: "test@test.com",
        accessToken: "te565653"
      };

      await deleteAccountPost(fakeService)(req as Request, res as Response);

      expect(fakeService.deleteAccount).to.have.been.calledOnce;
      expect(res.render).to.have.calledWith("delete-account/confirmed.njk");
    });
  });
});
