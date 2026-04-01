const { FlatCompat } = require("@eslint/eslintrc");
const js = require("@eslint/js");
const path = require("path");

const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
});

module.exports = [
  {
    ignores: [
      "node_modules/**",
      ".expo/**",
      "dist/**",
      "build/**",
      "convex/_generated/**",
      "scripts/**",
      "server/**",
      "plugins/**",
      "babel.config.js",
      "metro.config.js",
      "eslint.config.js",
    ],
  },
  ...compat.extends(
    "expo",
    "plugin:@typescript-eslint/recommended"
  ),
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
    },
  },
];
