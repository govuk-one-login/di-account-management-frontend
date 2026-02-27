import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as sessionStore from "../../../utils/session-store.js";
import { logoutPost } from "../logout-controller.js";

describe("logout controller", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = {
      body: {},
      session: {
        user: { subjectId: "subject-id" },
        destroy: vi.fn((callback) => callback()),
      } as any,
      oidc: { endSessionUrl: vi.fn() },
      app: { locals: { sessionStore: vi.fn() } },
    };
    res = {
      render: vi.fn(),
      redirect: vi.fn(() => {}),
      locals: {
        sessionId: "session-id",
        trace: "trace-id",
      },
      mockCookies: {},
      cookie: function (name: string, value: string) {
        this.mockCookies[name] = value;
      },
    };
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should execute logout process", async () => {
    req.session.user.tokens = {
      idToken: "id-token",
    } as any;

    const destroyUserSessionsStub = vi.spyOn(
      sessionStore,
      "destroyUserSessions"
    );
    await logoutPost(req, res);

    expect(res.mockCookies.lo).toBe("true");
    expect(req.oidc.endSessionUrl).toHaveBeenCalledOnce();
    expect(res.redirect).toHaveBeenCalled();
    expect(destroyUserSessionsStub).toHaveBeenCalled();
  });
});
