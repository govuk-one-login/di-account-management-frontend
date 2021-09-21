import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";

import {
  deleteAccountConfirmationGet,
  updateEmailConfirmationGet,
  updatePasswordConfirmationGet,
  updatePhoneNumberConfirmationGet,
} from "../update-confirmation-controller";

describe("update confirmation controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();

    req = {
      body: {},
      session: { user: { state: {} }, destroy: sandbox.fake() },
      t: sandbox.fake.returns("translated-string"),
    };
    res = { render: sandbox.fake(), redirect: sandbox.fake(), locals: {} };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("updateEmailConfirmationGet", () => {
    it("should render update email confirmation page", () => {
      updateEmailConfirmationGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
    });
  });

  describe("updatePasswordConfirmationGet", () => {
    it("should render update password confirmation page", () => {
      updatePasswordConfirmationGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
    });
  });

  describe("updatePhoneNumberConfirmationGet", () => {
    it("should render update phone number page", () => {
      updatePhoneNumberConfirmationGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
    });
  });

  describe("deleteAccountConfirmationGet", () => {
    it("should render delete confirmation page", () => {
      deleteAccountConfirmationGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("update-confirmation/index.njk");
    });
  });
});
