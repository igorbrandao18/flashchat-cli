const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname, {
  // Enable experimental features for Expo Router
  unstable_enableFastClient: true,
  unstable_enableWebRouter: true,
});

// Add additional extensions for the router
config.resolver.sourceExts.push('mjs');

module.exports = config; 