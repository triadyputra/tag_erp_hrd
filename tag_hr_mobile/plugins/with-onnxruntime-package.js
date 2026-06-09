const { withMainApplication } = require("@expo/config-plugins");
const { mergeContents } = require("@expo/config-plugins/build/utils/generateCode");

const ONNX_IMPORT = "import ai.onnxruntime.reactnative.OnnxruntimePackage";
const ONNX_PACKAGE = "add(OnnxruntimePackage())";

function withOnnxruntimePackage(config) {
  return withMainApplication(config, (cfg) => {
    let contents = cfg.modResults.contents;

    if (!contents.includes(ONNX_IMPORT)) {
      const importResult = mergeContents({
        src: contents,
        newSrc: ONNX_IMPORT,
        tag: "onnxruntime-react-native-import",
        anchor: /^import expo\.modules\.ApplicationLifecycleDispatcher/,
        offset: 0,
        comment: "// onnxruntime-react-native-import",
      });
      contents = importResult.contents;
    }

    if (!contents.includes(ONNX_PACKAGE)) {
      const packageResult = mergeContents({
        src: contents,
        newSrc: `              ${ONNX_PACKAGE}`,
        tag: "onnxruntime-react-native-package",
        anchor: /PackageList\(this\)\.packages\.apply \{/,
        offset: 1,
        comment: "              // onnxruntime-react-native-package",
      });
      contents = packageResult.contents;
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
}

module.exports = withOnnxruntimePackage;
