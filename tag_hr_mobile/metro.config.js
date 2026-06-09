const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// onnxruntime-common ships ESM .js paths that break Metro lazy imports.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
