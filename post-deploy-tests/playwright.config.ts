import { defineConfig, devices } from "@playwright/test";
import { cucumberReporter, defineBddConfig } from "playwright-bdd";
import path from "node:path";
import { getBaseUrl } from "./utils/getBaseUrl";
import { env } from "./env";

const testDir = defineBddConfig({
  features: "tests/features/**/*.feature",
  steps: "tests/steps/**/*.ts",
});

const isLocal = env.TEST_ENVIRONMENT === "local";

export default defineConfig({
  testDir,
  forbidOnly: !isLocal,
  workers: "50%",
  snapshotPathTemplate:
    "../e2e-tests-output/snaps/{projectName}/{testFilePath}/{arg}{ext}",
  reporter: [
    // See https://govukverify.atlassian.net/wiki/spaces/PLAT/pages/3054010402/How+to+run+tests+against+your+deployed+application+in+a+SAM+deployment+pipeline#Test-reports
    cucumberReporter("json", {
      outputFile: path.join(env.TEST_REPORT_DIR, "report.json"),
    }),
  ],
  use: {
    baseURL: getBaseUrl(),
    testIdAttribute: "data-test-id",
    bypassCSP: true,
  },
  projects: [
    {
      name: "Chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
