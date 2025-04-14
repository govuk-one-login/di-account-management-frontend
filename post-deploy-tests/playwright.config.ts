import "dotenv/config";
import { defineConfig, devices } from "@playwright/test";
import { cucumberReporter, defineBddConfig } from "playwright-bdd";
import path from "node:path";
import { getTestEnvironment } from "./utils/getTestEnvironment";
import * as v from "valibot";
import { getBaseUrl } from "./utils/getBaseUrl";

const testDir = defineBddConfig({
  features: "tests/features/**/*.feature",
  steps: "tests/steps/**/*.ts",
});

const isLocal = getTestEnvironment() === "local";

export default defineConfig({
  testDir,
  forbidOnly: !isLocal,
  retries: isLocal ? 0 : 2,
  workers: "50%",
  reporter: [
    // See https://govukverify.atlassian.net/wiki/spaces/PLAT/pages/3054010402/How+to+run+tests+against+your+deployed+application+in+a+SAM+deployment+pipeline#Test-reports
    cucumberReporter("json", {
      outputFile: path.join(
        v.parse(
          v.string(),
          process.env.TEST_REPORT_ABSOLUTE_DIR ?? process.env.TEST_REPORT_DIR
        ),
        "report.json"
      ),
    }),
  ],
  use: {
    baseURL: getBaseUrl(),
    testIdAttribute: "data-test-id",
  },
  projects: [
    {
      name: "Chrome",
      use: { ...devices["Desktop Chrome"], channel: "chrome" },
    },
  ],
});
