const path = require("path");

/**
 * onnxruntime-react-native ships an Expo gradle plugin but no RN autolinking config,
 * so NativeModules.Onnxruntime stays undefined unless we register OnnxruntimePackage.
 */
module.exports = {
  dependencies: {
    "onnxruntime-react-native": {
      root: path.join(__dirname, "node_modules/onnxruntime-react-native"),
      platforms: {
        android: {
          sourceDir: "android",
          packageImportPath:
            "import ai.onnxruntime.reactnative.OnnxruntimePackage;",
          packageInstance: "new OnnxruntimePackage()",
        },
      },
    },
  },
};
