import { describe, it, expect } from "vitest";
import request from "supertest";
import express from "express";
import helmet from "helmet";
import {
  helmetConfiguration,
  webchatHelmetConfiguration,
} from "../../../config/helmet.js";
import { PATH_DATA } from "../../../app.constants.js";

function createTestApp() {
  const app = express();

  app.use((req, res, next) => {
    res.locals.scriptNonce = "test-nonce";
    res.locals.missionLabWebSocketAddress = "wss://test.example.com";
    next();
  });

  app.use(helmet(helmetConfiguration));
  app.use(PATH_DATA.CONTACT.url, helmet(webchatHelmetConfiguration));

  app.get(PATH_DATA.CONTACT.url, (req, res) => res.send("contact"));
  app.get(PATH_DATA.HEALTHCHECK.url, (req, res) => res.send("ok"));

  return app;
}

describe("CSP header scoping", () => {
  const app = createTestApp();

  describe("contact page uses webchat CSP", () => {
    it("should include script-src-attr with unsafe-inline", async () => {
      const res = await request(app).get(PATH_DATA.CONTACT.url);
      const csp = res.headers["content-security-policy"];

      expect(csp).toContain("script-src-attr");
      expect(csp).toContain("'unsafe-inline'");
    });

    it("should include strict-dynamic in script-src", async () => {
      const res = await request(app).get(PATH_DATA.CONTACT.url);
      const csp = res.headers["content-security-policy"];

      expect(csp).toContain("'strict-dynamic'");
    });

    it("should include smartagent.app in script-src", async () => {
      const res = await request(app).get(PATH_DATA.CONTACT.url);
      const csp = res.headers["content-security-policy"];

      expect(csp).toContain("*.smartagent.app");
    });

    it("should include frame-src with smartagent.app", async () => {
      const res = await request(app).get(PATH_DATA.CONTACT.url);
      const csp = res.headers["content-security-policy"];

      expect(csp).toContain("frame-src");
      expect(csp).toContain("*.smartagent.app");
    });
  });

  describe("non-contact pages use strict CSP", () => {
    it("should not include unsafe-inline or webchat sources", async () => {
      const res = await request(app).get(PATH_DATA.HEALTHCHECK.url);
      const csp = res.headers["content-security-policy"];

      expect(csp).not.toContain("'unsafe-inline'");
      expect(csp).not.toContain("'strict-dynamic'");
      expect(csp).not.toContain("smartagent.app");
    });
  });
});
