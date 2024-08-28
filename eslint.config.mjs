import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import mochaPlugin from "eslint-plugin-mocha";
import eslintConfigPrettier from "eslint-config-prettier";

export default [
  { files: ["**/*.{js,mjs,cjs,ts}"] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  mochaPlugin.configs.flat.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: [
      "*.d.ts",
      "node_modules",
      "dist",
      "functional-output",
      "coverage",
      "src/assets/javascript",
      "dev-app.js",
    ],
  },
  {
    rules: {
      "no-console": 2,
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          vars: "all",
          args: "after-used",
          ignoreRestSiblings: true,
          caughtErrors: "none", // Add this line to ignore unused variables in catch blocks
        },
      ],
      "mocha/no-exclusive-tests": "error",
      "mocha/no-mocha-arrows": "off",
      "mocha/no-setup-in-describe": "off",
      "mocha/no-async-describe": "off",
      "mocha/max-top-level-suites": "off",
      "mocha/no-top-level-hooks": "off",
    },
  },
  {
    plugins: {
      tseslint,
    },
    files: ["**/*.test.ts", "**/*.test.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "@typescript-eslint/no-unused-expressions": "off",
    },
  },
  eslintConfigPrettier,
];
