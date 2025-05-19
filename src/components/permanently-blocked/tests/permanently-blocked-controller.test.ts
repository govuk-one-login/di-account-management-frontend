import { expect } from "chai";
import { describe } from "mocha";

import { sinon } from "../../../../test/utils/test-utils";
import { Request, Response } from "express";
import { permanentlyBlockedGet } from "../permanently-blocked-controller";
import {
  RequestBuilder,
  ResponseBuilder,
  TXMA_AUDIT_ENCODED,
} from "../../../../test/utils/builders";

describe("temporarily blocked controller", () => {
  let sandbox: sinon.SinonSandbox;
  let req: Partial<Request>;
  let res: Partial<Response>;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
    req = new RequestBuilder()
      .withBody({})
      .withSessionUserState({ addBackup: { value: "CHANGE_VALUE" } })
      .withTranslate(sandbox.fake((id) => id))
      .withHeaders({ "txma-audit-encoded": TXMA_AUDIT_ENCODED })
      .build();

    res = new ResponseBuilder()
      .withRender(sandbox.fake())
      .withRedirect(sandbox.fake())
      .withStatus(sandbox.fake())
      .build();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("permanentlyBlockedGet", () => {
    it("should render the permanently blocked view", () => {
      permanentlyBlockedGet(req as Request, res as Response);

      expect(res.render).to.have.calledWith("permanently-blocked/index.njk");
      expect(res.status).to.have.calledWith(401);
    });
  });
});
