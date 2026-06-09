const { withAppBuildGradle } = require("@expo/config-plugins");

/**
 * Wire release signing from android/keystore.properties (upload key for Play Store).
 */
function withAndroidReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    let contents = cfg.modResults.contents;

    if (contents.includes("keystorePropertiesFile")) {
      return cfg;
    }

    const keystoreLoader = `
def keystorePropertiesFile = new File(rootProject.projectDir, "keystore.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystorePropertiesFile.withInputStream { keystoreProperties.load(it) }
}
`;

    contents = contents.replace(/android\s*\{/, `${keystoreLoader}\nandroid {`);

    if (!contents.includes("signingConfigs.release")) {
      contents = contents.replace(
        /signingConfigs\s*\{/,
        `signingConfigs {
        release {
            if (keystorePropertiesFile.exists() && keystoreProperties['storeFile']) {
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
            }
        }`,
      );
    }

    contents = contents.replace(
      /release\s*\{([^}]*?)signingConfig signingConfigs\.debug/s,
      (match, inner) => {
        if (inner.includes("signingConfig signingConfigs.release")) {
          return match;
        }
        return `release {${inner}signingConfig signingConfigs.release`;
      },
    );

    cfg.modResults.contents = contents;
    return cfg;
  });
}

module.exports = withAndroidReleaseSigning;
