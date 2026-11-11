// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  packageManager: "npm",
  testRunner: "vitest",
  reporters: ["html", "clear-text", "progress", "json"],
  jsonReporter: {
    fileName: "reports/mutation/mutation.json",
  },
  vitest: {
    configFile: "vitest.stryker.config.ts",
  },
  // Only mutate production source; skip tests, mocks, fixtures and generated files.
  mutate: [
    "src/**/*.ts",
    "!src/**/*.test.ts",
    "!src/**/*.tests.ts",
    "!src/**/tests/**",
    "!src/**/test/**",
    "!src/**/*.d.ts",
    "!src/**/types.ts",
  ],
  coverageAnalysis: "perTest",
  concurrency: 4,
  timeoutMS: 60000,
  tempDirName: ".stryker-tmp",
  thresholds: {
    high: 80,
    low: 60,
    break: null,
  },
};

export default config;
