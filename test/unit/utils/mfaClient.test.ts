import { expect } from "chai";
import { describe } from "mocha";
import sinon from "sinon";

import MfaClient from "../../../src/utils/mfaClient";
import { getRequestConfig } from "../../../src/utils/http";

describe("MfaClient", () => {
  let sandbox: sinon.SinonSandbox;
  const requestConfig = getRequestConfig({ token: "token" });
  const client = new MfaClient("publicSubjectId", requestConfig);

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("retrieve", () => {
    it("should return a list of MfaMethods", () => {
      const methods = client.retrieve();
      expect(methods.length).to.eq(0);
    });
  });
});
