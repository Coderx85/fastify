import js from "@eslint/js";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  globalIgnores([
    "dist/",
    "node_modules/",
    "**/*.config.{js,ts}",
    "**/*.test.{js,ts}",
    "**/*.spec.{js,ts}",
    "**/*.d.ts",
    "api/",
    "src/schema/",
    "samples/",
    "tsconfig.*.json",
  ]),
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
    languageOptions: { globals: globals.node },
    rules: {
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "no-undef": "error",
      "sort-imports": ["off"],
      "no-console": ["off"],
    },
  },
]);
