const fs = require("node:fs");
const path = require("node:path");

const PACKAGE_NAME = "app.replit.investlensmobile";
const SIGNING_MARKER = "// InvestLens Codemagic upload signing";

function prepareVersion(config, env) {
  if (config.expo?.android?.package !== PACKAGE_NAME) {
    throw new Error("Unexpected Android package; refusing to build another app");
  }
  let version = env.ANDROID_VERSION_CODE;
  if (!version) {
    if (!/^\d+$/.test(env.BUILD_NUMBER ?? "")) {
      throw new Error("Missing or invalid Codemagic BUILD_NUMBER");
    }
    version = String(100 + Number(env.BUILD_NUMBER));
  }
  if (!/^[1-9]\d*$/.test(version) || Number(version) > 2100000000) {
    throw new Error("ANDROID_VERSION_CODE must be an integer from 1 to 2100000000");
  }
  return {
    ...config,
    expo: {
      ...config.expo,
      android: { ...config.expo.android, versionCode: Number(version) },
    },
  };
}

function configureSigning(gradle) {
  if (!gradle.includes("com.android.application")) {
    throw new Error("Expected the generated Android application build.gradle");
  }
  if (gradle.includes(SIGNING_MARKER)) {
    throw new Error("Upload signing already configured; refusing to append it twice");
  }
  // No credentials are written into source: Gradle reads Codemagic's secure
  // signing-identity variables only on the remote build machine.
  return `${gradle}\n${SIGNING_MARKER}
android {
    signingConfigs {
        codemagicUpload {
            storeFile file(System.getenv("CM_KEYSTORE_PATH"))
            storePassword System.getenv("CM_KEYSTORE_PASSWORD")
            keyAlias System.getenv("CM_KEY_ALIAS")
            keyPassword System.getenv("CM_KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.codemagicUpload
        }
    }
}
`;
}

if (require.main === module) {
  const mobileDir = path.resolve(process.env.MOBILE_DIR || "artifacts/investlens-mobile");
  const command = process.argv[2];
  if (command === "version") {
    const file = path.join(mobileDir, "app.json");
    const config = prepareVersion(JSON.parse(fs.readFileSync(file, "utf8")), process.env);
    fs.writeFileSync(file, `${JSON.stringify(config, null, 2)}\n`);
    console.log(`Android package ${PACKAGE_NAME}; versionCode ${config.expo.android.versionCode}`);
  } else if (command === "signing") {
    const file = path.join(mobileDir, "android/app/build.gradle");
    fs.writeFileSync(file, configureSigning(fs.readFileSync(file, "utf8")));
    console.log("Configured the selected Codemagic upload identity for release builds.");
  } else {
    throw new Error("Usage: node scripts/codemagic-android.cjs version|signing");
  }
}

module.exports = { PACKAGE_NAME, SIGNING_MARKER, prepareVersion, configureSigning };
