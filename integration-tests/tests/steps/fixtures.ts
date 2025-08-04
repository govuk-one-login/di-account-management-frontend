import { test as base, createBdd } from "playwright-bdd";
import { env } from "../../env";

export const test = base.extend<{
  skips: undefined;
  fails: undefined;
}>({
  skips: [
    async ({ $test, $tags, isMobile }, use) => {
      $test.skip(
        ($tags.includes("@skipMobile") && isMobile) ||
          ($tags.includes("@skipDesktop") && !isMobile) ||
          $tags.includes(`@skipTarget-${env.TEST_TARGET}`) ||
          ($tags.includes(`@skipPreDeploy`) &&
            env.PRE_OR_POST_DEPLOY == "pre") ||
          (env.PRE_OR_POST_DEPLOY === "post" && !$tags.includes("@postDeploy"))
      );

      await use(undefined);
    },
    { auto: true },
  ],

  fails: [
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
