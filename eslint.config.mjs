import globals from "globals";
import pluginJs from "@eslint/js";
import tsEslint from "typescript-eslint";
import vitestPlugin from "eslint-plugin-vitest";
import eslintConfigPrettier from "eslint-config-prettier";
import tsEslintParser from "@typescript-eslint/parser";

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  {
    languageOptions: {
      globals: globals.browser,
      parser: tsEslintParser,
      ecmaVersion: 2022,
      sourceType: "module",
      parserOptions: {
        project: [
          "./tsconfig.json",
          "./tsconfig.test.json",
          "./integration-tests/tsconfig.json",
        ],
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  pluginJs.configs.recommended,
  ...tsEslint.configs.recommended,
  ...tsEslint.configs.stylistic,
  {
    ignores: [
      "*.d.ts",
      "node_modules",
      "dist",
      "functional-output",
      "coverage",
      "src/assets/javascript",
      "dev-app.js",
      "integration-tests",
      "eslint.config.mjs",
      "vitest.setup.ts",
      "vitest.config.ts",
      "fix-errors.cjs",
      "fix-unused-imports.mjs",
      "fix-all-unused.mjs",
    ],
  },
  {
    rules: {
      "no-console": "error",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: true,
          caughtErrors: "none",
        },
      ],
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/await-thenable": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "@typescript-eslint/require-await": "warn",
    },
  },
  {
    plugins: {
      tsEslint,
      vitest: vitestPlugin,
    },
    files: ["**/*.test.ts", "**/*.test.js"],
    rules: {
      ...vitestPlugin.configs.recommended.rules,
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off",
      "@typescript-eslint/no-empty-function": "off",
      "vitest/expect-expect": [
        "error",
        {
          assertFunctionNames: [
            "expect",
            "checkFailedCSRFValidationBehaviour",
            "performTest",
            "request.**.expect",
          ],
        },
      ],
    },
  },
  eslintConfigPrettier,
];
