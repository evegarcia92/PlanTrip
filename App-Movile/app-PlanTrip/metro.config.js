// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');
const defaultConfig = getDefaultConfig(__dirname);

module.exports = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    // Add .wasm to asset extensions so Metro bundles it correctly
    assetExts: [...defaultConfig.resolver.assetExts, 'wasm'],
  },
};
