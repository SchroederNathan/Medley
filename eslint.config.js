// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const reactCompiler = require("eslint-plugin-react-compiler");
const tanstackQuery = require("@tanstack/eslint-plugin-query");

module.exports = defineConfig([
  expoConfig,
  eslintPluginPrettierRecommended,
  reactCompiler.configs.recommended,
  ...tanstackQuery.configs["flat/recommended"],
  {
    ignores: ["dist/*"],
  },
]);
