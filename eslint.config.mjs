export default [
  {
    ignores: [
      ".next/**",
      "out/**",
      "build/**",
      "node_modules/**",
      "coverage/**",
      "dist/**",
      ".worktrees/**",
      "*.config.js",
      "scripts/**", // Ignore scripts directory (uses CommonJS)
    ],
  },
];
