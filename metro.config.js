const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Explicitly disable Expo Router
config.transformer = {
  ...config.transformer,
  routerRoot: undefined,
};

module.exports = config;