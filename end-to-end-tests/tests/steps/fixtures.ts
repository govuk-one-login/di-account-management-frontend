import { test as base, createBdd } from "playwright-bdd";
import { setupServer, SetupServerApi } from "msw/node";
import { env } from "../../env";

export const test = base.extend<
  {
    processSkipTags: undefined;
    processFixmeTags: undefined;
    processFailTags: undefined;
    mswTeardown: undefined;
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
        mswServer.listen({
          onUnhandledRequest: () => {},
        });
        await use(mswServer);
        mswServer.close();
      } else {
        await use(undefined);
      }
    },
    { scope: "worker" },
  ],

  mswTeardown: [
    async ({ mswServer }, use) => {
      await use(undefined);
      mswServer?.resetHandlers();
    },
    { auto: true },
  ],

  processSkipTags: [
    async ({ $test, $tags, isMobile }, use) => {
      $test.skip(
        ($tags.includes("@skipPreDeploy") &&
          env.PRE_OR_POST_DEPLOY === "pre") ||
          ($tags.includes("@skipPostDeploy") &&
            env.PRE_OR_POST_DEPLOY === "post") ||
          ($tags.includes("@skipMobile") && isMobile) ||
          ($tags.includes("@skipDesktop") && !isMobile)
      );

      await use(undefined);
    },
    { auto: true },
  ],

  processFixmeTags: [
    async ({ $test, $tags, isMobile }, use) => {
      $test.fixme(
        ($tags.includes("@fixmeMobile") && isMobile) ||
          ($tags.includes("@fixmeDesktop") && !isMobile)
      );

      await use(undefined);
    },
    { auto: true },
  ],

  processFailTags: [
    async ({ $test, $tags, isMobile }, use) => {
      $test.fail(
        ($tags.includes("@failMobile") && isMobile) ||
          ($tags.includes("@failDesktop") && !isMobile)
      );

      await use(undefined);
    },
    { auto: true },
  ],

  javaScriptEnabled: async ({ $tags }, use) => {
    if ($tags.includes("@noJs")) {
      await use(false);
    } else {
      await use(true);
    }
  },
});

export const bdd = createBdd(test);
