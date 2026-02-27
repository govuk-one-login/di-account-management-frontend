import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "di-account-management-rp-registry": resolve(
        __dirname,
        "node_modules/di-account-management-rp-registry/dist/index.js"
      ),
    },
  },
  test: {
    environment: "node",
    include: [
      "src/**/*.test.ts",
      "src/**/*.tests.ts",
      "test/unit/**/*.test.ts",
      "test/unit/**/*.tests.ts",
      "src/**/*.test.js",
      "test/unit/**/*.test.js",
      "src/**/tests/*-integration.test.ts",
    ],
    globals: false,
    setupFiles: ["dotenv/config", "./vitest.setup.ts"],
    coverage: {
      reporter: ["text", "lcov"],
      provider: "v8",
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/*.test.ts",
        "**/*.test.js",
        "**/static-hash.json",
      ],
    },
    passWithNoTests: true,
    testTimeout: 30000,
  },
});
