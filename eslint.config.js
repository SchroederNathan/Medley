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
  {
    rules: {
      // eslint-plugin-react-hooks 7 compiler rules false-positive on
      // Reanimated sharedValue.value writes and useRef(new Animated.Value()).
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
      // Pre-existing patterns; fix properly rather than suppressing per-line.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);
