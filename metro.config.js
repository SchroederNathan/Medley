const { getDefaultConfig } = require("expo/metro-config");
const { getSentryExpoConfig } = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname, {
  getDefaultConfig,
});

config.transformer = {
  ...config.transformer,
  // Keep Expo's asset hashing plugin present for older EAS CLI validators.
  assetPlugins: [
    ...(config.transformer?.assetPlugins ?? []),
    "expo-asset/tools/hashAssetFiles",
  ],
};

module.exports = config;
