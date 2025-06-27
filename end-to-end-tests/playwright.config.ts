import path from "node:path";
import { defineConfig, devices } from "@playwright/test";
import { cucumberReporter, defineBddConfig } from "playwright-bdd";
import { env } from "./env";
import { getBaseUrl } from "./utils/getBaseUrl";

const testDir = defineBddConfig({
  features: "tests/features/**/*.feature",
  steps: "tests/steps/**/*.ts",
});

export default defineConfig({
  testDir,
  forbidOnly: !env.HUMAN_IN_THE_LOOP,
  workers: "50%",
  snapshotPathTemplate: "./snapshots/{projectName}/{testFilePath}/{arg}{ext}",
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
      name: "Chromium",
      use: { ...devices["Desktop Chrome"], channel: "chromium" },
    },
  ],
});
