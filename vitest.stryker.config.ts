import { defineConfig, mergeConfig } from "vitest/config";
import baseConfig from "./vitest.config";

// Unit-only vitest config used by Stryker mutation testing.
// Integration tests (src/**/tests/*-integration.test.ts) require LocalStack and
// are excluded so mutation runs are fast and hermetic.
export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "src/**/tests/*-integration.test.ts",
        "src/utils/test/*-integration.test.ts",
      ],
    },
  })
);
