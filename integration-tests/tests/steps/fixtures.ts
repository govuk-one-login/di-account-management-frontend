import { test as base, createBdd } from "playwright-bdd";
import { env } from "../../env";

export const test = base.extend<{
  processSkipTags: undefined;
  processFailTags: undefined;
}>({
  processSkipTags: [
    async ({ $test, $tags, isMobile }, use) => {
      $test.skip(
        ($tags.includes("@skipMobile") && isMobile) ||
          ($tags.includes("@skipDesktop") && !isMobile) ||
          $tags.includes(`@skipTarget-${env.TEST_TARGET}`)
      );

      await use(undefined);
    },
    { auto: true },
  ],

  processFailTags: [
    async ({ $test, $tags, isMobile }, use) => {
      $test.fail(
        ($tags.includes("@failMobile") && isMobile) ||
          ($tags.includes("@failDesktop") && !isMobile) ||
          $tags.includes(`@failTarget-${env.TEST_TARGET}`)
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
