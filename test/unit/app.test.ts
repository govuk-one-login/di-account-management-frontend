import { afterEach, beforeEach, describe } from "mocha";
import { shutdownProcess, startServer } from "../../src/app.js";
import express from "express";
import { expect, sinon } from "../utils/test-utils";

describe("app", () => {
  describe("startServer", () => {
    let app: express.Application;

    beforeEach(() => {
      process.env.PORT = "6001";
      app = express();
    });

    afterEach(() => {
      sinon.restore();
      delete require.cache[require.resolve("../../src/app")];
      delete require.cache[
        require.resolve("@govuk-one-login/frontend-vital-signs")
      ];
    });

    it("should start server on expected port", async () => {
      const listenSpy = sinon.spy(app, "listen");
      const { closeServer } = await startServer(app);

      expect(listenSpy).to.be.calledOnceWith(process.env.PORT);

      await closeServer();
    });

    it("should start server with expected timeouts", async () => {
      const { server, closeServer } = await startServer(app);

      expect(server.keepAliveTimeout).to.be.eq(61 * 1000);
      expect(server.headersTimeout).to.be.eq(91 * 1000);

      await closeServer();
    });

    it("should start server with vital-signs package", async () => {
      const frontendVitalSigns = require("@govuk-one-login/frontend-vital-signs");
      sinon
        .stub(frontendVitalSigns, "frontendVitalSignsInit")
        .callsFake(() => () => {});
      const { startServer } = require("../../src/app");

      const { server, closeServer } = await startServer(app);

      expect(frontendVitalSigns.frontendVitalSignsInit).to.be.calledOnceWith(
        server,
        { staticPaths: [/^\/assets\/.*/, /^\/public\/.*/] }
      );
      await closeServer();
    });

    it("should close server properly", async () => {
      const frontendVitalSigns = require("@govuk-one-login/frontend-vital-signs");
      const stopVitalSigns = sinon.fake();
      sinon
        .stub(frontendVitalSigns, "frontendVitalSignsInit")
        .callsFake(() => stopVitalSigns);

      const { startServer } = require("../../src/app");
      const { closeServer } = await startServer(app);

      await closeServer();

      expect(stopVitalSigns).to.be.calledOnce;
    });
  });

  describe("shutdownProcess", () => {
    let exitStub: sinon.SinonStub<
      [code?: string | number | null | undefined],
      never
    >;

    beforeEach(() => {
      exitStub = sinon.stub(process, "exit");
    });

    afterEach(() => {
      sinon.restore();
    });

    it("executes closeServer callback before exiting successfully", async () => {
      const callback = sinon.fake();
      await shutdownProcess(callback)();
      expect(callback).to.be.calledOnce;
      expect(exitStub).to.be.calledOnceWith(0);
    });

    it("exits with error if callback throws error", async () => {
      const callback = sinon.fake(() => {
        throw new Error("Something unexpected happened");
      });
      await shutdownProcess(callback)();
      expect(exitStub).to.be.calledOnceWith(1);
    });
  });
});
