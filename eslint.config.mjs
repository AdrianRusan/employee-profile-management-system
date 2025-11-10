import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  // Global ignores must come first
  {
    ignores: [
      // Default ignores of eslint-config-next:
      ".next/**",
      "**/.next/**",
      "out/**",
      "build/**",
      "**/build/**",
      "next-env.d.ts",
      // Additional ignores:
      ".worktrees/**",
      "**/.worktrees/**",
      "node_modules/**",
      "coverage/**",
      "dist/**",
      // Config files that use CommonJS:
      "jest.config.js",
      "*.config.js",
    ],
  },
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow unused vars that start with underscore (intentionally unused parameters)
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
    },
  },
]);

export default eslintConfig;
