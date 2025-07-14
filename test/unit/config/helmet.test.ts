import { expect } from "chai";
import { describe } from "mocha";
import {
  getHelmetConfiguration,
  getWebchatHelmetConfiguration,
} from "../../../src/config/helmet";
import * as configModule from "../../../src/config";
import sinon from "sinon";

describe("Helmet", () => {
  afterEach(() => {
    sinon.restore();
  });

  it("it should return the correct configuration when allowUnsafeEval is false", () => {
    sinon.replace(configModule, "allowUnsafeEval", () => false);
    expect(
      getHelmetConfiguration()
        // @ts-expect-error - directives could be boolean but if it is test will error anyway
        .contentSecurityPolicy.directives.scriptSrc.some(
          (item: string) => item === "'unsafe-eval'"
        )
    ).to.be.false;
    expect(
      getWebchatHelmetConfiguration()
        // @ts-expect-error - directives could be boolean but if it is test will error anyway
        .contentSecurityPolicy.directives.scriptSrc.some(
          (item: string) => item === "'unsafe-eval'"
        )
    ).to.be.false;
  });

  it("it should return the correct configuration when allowUnsafeEval is true", () => {
    sinon.replace(configModule, "allowUnsafeEval", () => true);
    expect(
      getHelmetConfiguration()
        // @ts-expect-error - directives could be boolean but if it is test will error anyway
        .contentSecurityPolicy.directives.scriptSrc.some(
          (item: string) => item === "'unsafe-eval'"
        )
    ).to.be.true;
    expect(
      getWebchatHelmetConfiguration()
        // @ts-expect-error - directives could be boolean but if it is test will error anyway
        .contentSecurityPolicy.directives.scriptSrc.some(
          (item: string) => item === "'unsafe-eval'"
        )
    ).to.be.true;
  });
});
