import { test as base, createBdd } from "playwright-bdd";
import { setupServer, SetupServerApi } from "msw/node";
import { env } from "../../env";

export const test = base.extend<
  {
    processSkipTags: undefined;
    processFixmeTags: undefined;
    processFailTags: undefined;
    mswReset: undefined;
  },
  {
    mswServer: SetupServerApi;
  }
>({
  mswServer: [
    async ({}, use) => {
      const mswServer = setupServer();
      mswServer.listen({
        onUnhandledRequest: () => {},
      });
      await use(mswServer);
      mswServer.close();
    },
    { scope: "worker" },
  ],

  mswReset: [
    async ({ mswServer }, use) => {
      await use(undefined);
      mswServer.resetHandlers();
      mswServer.events.removeAllListeners();
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
    await use(!$tags.includes("@noJs"));
  },
});

export const bdd = createBdd(test);
