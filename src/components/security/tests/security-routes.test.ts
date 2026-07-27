import { describe, it, expect, vi, beforeEach } from "vitest";

describe("securityRouter", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  async function getHandlers(passkeys: boolean) {
    vi.doMock("../../../config.js", async (importOriginal) => {
      const actual =
        await importOriginal<typeof import("../../../config.js")>();
      return { ...actual, passkeysEnabled: () => passkeys };
    });
    const [
      { securityRouter },
      mfaMiddleware,
      requiresAuth,
      securityController,
    ] = await Promise.all([
      import("../security-routes.js"),
      import("../../../middleware/mfa-method-middleware.js"),
      import("../../../middleware/requires-auth-middleware.js"),
      import("../security-controller.js"),
    ]);
    const routes = (securityRouter as any).stack as any[];
    const handlers = routes.flatMap(
      (layer: any) => layer.route?.stack.map((s: any) => s.handle) ?? []
    );
    return { handlers, mfaMiddleware, requiresAuth, securityController };
  }

  it("should include mfaMethodMiddleware when passkeys are disabled", async () => {
    const { handlers, mfaMiddleware, requiresAuth, securityController } =
      await getHandlers(false);

    expect(handlers).toContain(mfaMiddleware.mfaMethodMiddleware);
    expect(handlers).toContain(requiresAuth.requiresAuthMiddleware);
    expect(handlers).toContain(securityController.securityGet);
  });

  it("should not include mfaMethodMiddleware when passkeys are enabled", async () => {
    const { handlers, mfaMiddleware, requiresAuth, securityController } =
      await getHandlers(true);

    expect(handlers).not.toContain(mfaMiddleware.mfaMethodMiddleware);
    expect(handlers).toContain(requiresAuth.requiresAuthMiddleware);
    expect(handlers).toContain(securityController.securityGet);
  });
});
