const assert = require("node:assert/strict");
const test = require("node:test");
const { prepareVersion, configureSigning } = require("./codemagic-android.cjs");

const config = {
  expo: {
    icon: "./assets/images/icon.png",
    ios: { bundleIdentifier: "app.replit.investlensmobile", buildNumber: "3" },
    android: { package: "app.replit.investlensmobile", adaptiveIcon: { backgroundColor: "#f7f8fa" } },
  },
};

test("sets an Android version without changing Apple configuration or the icon", () => {
  const result = prepareVersion(config, { BUILD_NUMBER: "7" });
  assert.equal(result.expo.android.versionCode, 107);
  assert.deepEqual(result.expo.ios, config.expo.ios);
  assert.equal(result.expo.icon, config.expo.icon);
  assert.deepEqual(result.expo.android.adaptiveIcon, config.expo.android.adaptiveIcon);
  assert.equal(config.expo.android.versionCode, undefined);
});

test("accepts an explicit positive version code", () => {
  assert.equal(prepareVersion(config, { ANDROID_VERSION_CODE: "201" }).expo.android.versionCode, 201);
});

test("rejects missing, fractional, negative, overflowing and malformed versions", () => {
  for (const env of [{}, { BUILD_NUMBER: "invalid" }, { BUILD_NUMBER: "-1" }, { BUILD_NUMBER: "1.5" }]) {
    assert.throws(() => prepareVersion(config, env));
  }
  for (const version of ["0", "-1", "1.5", "01", "2100000001", "Infinity", "1e3"]) {
    assert.throws(() => prepareVersion(config, { ANDROID_VERSION_CODE: version }));
  }
});

test("refuses to build a different Android application", () => {
  assert.throws(() => prepareVersion({ expo: { android: { package: "another.app" } } }, { BUILD_NUMBER: "1" }));
});

test("release signing references secure Codemagic variables rather than debug signing", () => {
  const gradle = 'apply plugin: "com.android.application"\nandroid { buildTypes { release { signingConfig signingConfigs.debug } } }\n';
  const result = configureSigning(gradle);
  for (const key of ["CM_KEYSTORE_PATH", "CM_KEYSTORE_PASSWORD", "CM_KEY_ALIAS", "CM_KEY_PASSWORD"]) {
    assert.ok(result.includes(`System.getenv("${key}")`));
  }
  assert.ok(result.lastIndexOf("signingConfig signingConfigs.codemagicUpload") > result.indexOf("signingConfigs.debug"));
  assert.throws(() => configureSigning(result), /already configured/);
});

test("refuses an unrecognized Gradle application file", () => {
  assert.throws(() => configureSigning("android {}"), /Expected/);
});
