import { expect } from "chai";
import { describe } from "mocha";
import sinon from "sinon";
import { getRefererFrom } from "../../../src/utils/logger.js";

describe("Logger", () => {
  let sandbox: sinon.SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe("getRefererFrom", () => {
    it("should return the pathname and search from a valid referer URL", () => {
      const referer = "https://www.example.com/path/to/page?query=param";
      const expectedReferer = "/path/to/page?query=param";
      expect(getRefererFrom(referer)).to.equal(expectedReferer);
    });

    it("should return undefined for an invalid referer URL", () => {
      const referer = "invalid-url";
      expect(getRefererFrom(referer)).to.be.undefined;
    });

    it("should return undefined for an empty referer", () => {
      const referer = "";
      expect(getRefererFrom(referer)).to.be.undefined;
    });

    it("should return undefined for a null referer", () => {
      const referer: string = null;
      expect(getRefererFrom(referer)).to.be.undefined;
    });

    it("should handle errors when parsing an invalid referer URL", () => {
      const consoleErrorStub = sandbox.stub(console, "error");
      const invalidReferer = "http://localhost:3000/%$%^";
      const stubbedURLConstructor = sandbox.stub(global, "URL").throws();
      const result = getRefererFrom(invalidReferer);
      expect(result).to.be.undefined;
      expect(consoleErrorStub).to.have.been.calledOnce;
      expect(consoleErrorStub.firstCall.args[0]).to.contain(
        "Logger: Error obtaining referer URL"
      );
      stubbedURLConstructor.restore();
    });
  });
});
