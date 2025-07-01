import { test as base, createBdd } from "playwright-bdd";
import { setupServer, SetupServerApi } from "msw/node";
import { env } from "../../env";
import AxeBuilder from "@axe-core/playwright";

export const test = base.extend<
  {
    processSkipTags: undefined;
    mswTeardown: undefined;
    accessibilityScan: undefined;
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

  javaScriptEnabled: async ({ $tags }, use) => {
    if ($tags.includes("@nojs")) {
      await use(false);
    } else {
      await use(true);
    }
  },

  accessibilityScan: [
    async ({ $test, page, javaScriptEnabled }, use) => {
      await page.waitForLoadState("load");

      if (javaScriptEnabled) {
        const accessibilityScanResults = await new AxeBuilder({ page })
          .withTags(["wcag22aa"])
          .analyze();

        $test.info().annotations.push({
          type: "accessibility_violations",
          description: accessibilityScanResults.violations.length
            ? JSON.stringify(accessibilityScanResults.violations, null, 2)
            : "None",
        });
      } else {
        $test.info().annotations.push({
          type: "accessibility_violations",
          description:
            "Unable to perform accessibility scan as JavaScript is disabled",
        });
      }

      await use(undefined);
    },
    { auto: true },
  ],
});

export const bdd = createBdd(test);
