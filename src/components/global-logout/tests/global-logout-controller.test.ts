import { expect } from "chai";
import sinon from "sinon";
import { globalLogoutGet } from "../global-logout-controller";
import { Request, Response } from "express";

describe("Global Logout Controller", () => {
  describe("globalLogoutGet", () => {
    it("should render the correct view", () => {
      const req = {} as Request;
      const res = { render: sinon.spy() };

      globalLogoutGet(req, res as unknown as Response);

      expect(res.render.calledOnce).to.be.true;
      expect(res.render.firstCall.args[0]).to.equal("global-logout/index.njk");
      expect(res.render.firstCall.args[1]).to.deep.equal({});
    });
  });
});
