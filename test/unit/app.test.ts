import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import { shutdownProcess, startServer, createApp } from "../../src/app.js";
import express from "express";

vi.mock("@govuk-one-login/frontend-vital-signs", () => ({
  frontendVitalSignsInit: vi.fn(() => vi.fn()),
}));

import * as frontendVitalSigns from "@govuk-one-login/frontend-vital-signs";

describe("app", () => {
  describe("createApp", () => {
    it("should create an Express application", async () => {
      const app = await createApp();

      expect(app).toBeDefined();
      expect(typeof app).toBe("function");
      expect(app.listen).toBeDefined();
    });

    it("should enable trust proxy", async () => {
      const app = await createApp();

      expect(app.get("trust proxy")).toBeTruthy();
    });

    it("should have nunjucks engine configured", async () => {
      const app = await createApp();

      expect(app.get("nunjucksEngine")).toBeDefined();
    });

    it("should have session store in locals", async () => {
      const app = await createApp();

      expect(app.locals.sessionStore).toBeDefined();
    });
  });

  describe("startServer", () => {
    let app: express.Application;
    const testPort = 6066;

    beforeEach(() => {
      app = express();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should start server on expected port", async () => {
      const listenSpy = vi.spyOn(app, "listen");
      const { closeServer } = await startServer(app, testPort);

      expect(listenSpy).toHaveBeenCalledWith(testPort, expect.any(Function));

      await closeServer();
    });

    it("should start server with expected timeouts", async () => {
      const { server, closeServer } = await startServer(app, testPort);

      expect(server.keepAliveTimeout).toBe(61 * 1000);
      expect(server.headersTimeout).toBe(91 * 1000);

      await closeServer();
    });

    it("should start server with vital-signs package", async () => {
      const { server, closeServer } = await startServer(app, testPort);

      expect(frontendVitalSigns.frontendVitalSignsInit).toHaveBeenCalledWith(
        server,
        { staticPaths: [/^\/assets\/.*/, /^\/public\/.*/] }
      );
      await closeServer();
    });

    it("should close server properly", async () => {
      const { closeServer } = await startServer(app, testPort);

      await closeServer();

      const stopVitalSigns = vi.mocked(
        frontendVitalSigns.frontendVitalSignsInit
      ).mock.results[0].value;
      expect(stopVitalSigns).toHaveBeenCalledOnce();
    });
  });

  describe("shutdownProcess", () => {
    let exitStub: ReturnType<typeof vi.spyOn<typeof process, any>>;

    beforeEach(() => {
      exitStub = vi
        .spyOn(process, "exit")
        .mockImplementation(() => undefined as never);
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("executes closeServer callback before exiting successfully", async () => {
      const callback = vi.fn();
      await shutdownProcess(callback)();
      expect(callback).toHaveBeenCalledOnce();
      expect(exitStub).toHaveBeenCalledWith(0);
    });

    it("exits with error if callback throws error", async () => {
      const callback = vi.fn(() => {
        throw new Error("Something unexpected happened");
      });
      await shutdownProcess(callback)();
      expect(exitStub).toHaveBeenCalledWith(1);
    });
  });
});
