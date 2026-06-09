const { withAndroidManifest } = require("@expo/config-plugins");

/**
 * Android 11+ package visibility: izinkan membuka pemasang APK (ACTION_VIEW).
 */
function withAndroidApkInstall(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;

    if (!manifest.queries) {
      manifest.queries = [];
    }

    const hasApkView = manifest.queries.some(
      (q) =>
        Array.isArray(q.intent) &&
        q.intent.some(
          (intent) =>
            intent.action?.some(
              (a) => a?.$?.["android:name"] === "android.intent.action.VIEW",
            ) &&
            intent.data?.some(
              (d) =>
                d?.$?.["android:mimeType"] ===
                "application/vnd.android.package-archive",
            ),
        ),
    );

    if (!hasApkView) {
      manifest.queries.push({
        intent: [
          {
            action: [{ $: { "android:name": "android.intent.action.VIEW" } }],
            data: [
              {
                $: {
                  "android:mimeType":
                    "application/vnd.android.package-archive",
                },
              },
            ],
          },
        ],
      });
    }

    const hasPackageInstaller = manifest.queries.some(
      (q) =>
        Array.isArray(q.intent) &&
        q.intent.some((intent) =>
          intent.action?.some(
            (a) =>
              a?.$?.["android:name"] ===
              "android.intent.action.INSTALL_PACKAGE",
          ),
        ),
    );

    if (!hasPackageInstaller) {
      manifest.queries.push({
        intent: [
          {
            action: [
              {
                $: { "android:name": "android.intent.action.INSTALL_PACKAGE" },
              },
            ],
          },
        ],
      });
    }

    return cfg;
  });
}

module.exports = withAndroidApkInstall;
