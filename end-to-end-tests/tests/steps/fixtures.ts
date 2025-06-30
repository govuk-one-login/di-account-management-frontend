import type { ConsoleMessage } from "@playwright/test";
import { test as base, createBdd } from "playwright-bdd";
import { setupServer, SetupServerApi } from "msw/node";
import { env } from "../../env";

export const test = base.extend<
  {
    beforeAndAfterEach: undefined;
  },
  {
    mswServer?: SetupServerApi;
  }
>({
  mswServer: [
    // Empty object is required to suppress Playwright error "First argument must use the object destructuring pattern"
    // eslint-disable-next-line no-empty-pattern
    async ({}, use) => {
      if (env.TEST_TARGET === "local") {
        const mswServer = setupServer();
        mswServer.listen();
        await use(mswServer);
        mswServer.close();
      } else {
        await use(undefined);
      }
    },
    { scope: "worker", auto: true },
  ],

  beforeAndAfterEach: [
    async ({ $test, $tags, mswServer }, use) => {
      $test.skip(
        ($tags.includes("@skipPreDeploy") &&
          env.PRE_OR_POST_DEPLOY === "pre") ||
          ($tags.includes("@skipPostDeploy") &&
            env.PRE_OR_POST_DEPLOY === "post")
      );

      await use(undefined);
      mswServer?.resetHandlers();
    },
    { auto: true },
  ],

  page: async ({ page }, use) => {
    const logs: {
      msg: ConsoleMessage;
      type: string;
      location: string;
    }[] = [];
    page.on("console", (msg) => {
      const location = msg.location();
      logs.push({
        msg,
        type: msg.type(),
        location: `${location.url}:${location.lineNumber}:${location.columnNumber}`,
      });
    });

    const exceptions: Error[] = [];
    page.on("pageerror", (exception) => {
      exceptions.push(exception);
    });

    await use(page);

    console.log({ "Console logs": logs });

    console.log({ Exceptions: exceptions });
  },

  javaScriptEnabled: async ({ $tags }, use) => {
    if ($tags.includes("@nojs")) {
      await use(false);
    } else {
      await use(true);
    }
  },
});

export const bdd = createBdd(test);
