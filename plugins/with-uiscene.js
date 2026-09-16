// SDK 57 compatibility backport based on expo/config-plugins#326
// Upstream commit: 8da695859619816dd9b4453530838b349e2b1092 (MIT).
const { withAppDelegate, withInfoPlist } = require("expo/config-plugins");
const semver = require("semver");

module.exports = function withUIScene(config) {
  const version = require("expo/package.json").version;
  if (!semver.satisfies(version, ">=57.0.23 <58.0.0")) {
    throw new Error("UIScene compatibility plugin requires Expo >=57.0.23 <58.");
  }
  const manifest = {
    UIApplicationSupportsMultipleScenes: false,
    UISceneConfigurations: {
      UIWindowSceneSessionRoleApplication: [{
        UISceneConfigurationName: "Default Configuration",
        UISceneDelegateClassName: "EXExpoAppSceneDelegate",
      }],
    },
  };
  config = withAppDelegate(config, (config) => {
    const original = "class AppDelegate: ExpoAppDelegate {";
    const replacement = "class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {";
    const source = config.modResults.contents;
    if (source.includes(replacement)) return config;
    const startup = /    window = UIWindow\(frame: UIScreen.main.bounds\)\r?\n    factory.startReactNative\(\r?\n      withModuleName: "main",\r?\n      in: window,\r?\n      launchOptions: launchOptions\)\r?\n/;
    if (config.modResults.language !== "swift" || !source.includes(original) || !startup.test(source)) {
      throw new Error("UIScene plugin requires the standard SDK 57 AppDelegate.");
    }
    config.modResults.contents = source.replace(original, replacement).replace(startup, "");
    return config;
  });
  return withInfoPlist(config, (config) => {
    const current = config.modResults.UIApplicationSceneManifest;
    if (current && JSON.stringify(current) !== JSON.stringify(manifest)) {
      throw new Error("Refusing to replace an existing custom scene manifest.");
    }
    config.modResults.UIApplicationSceneManifest = manifest;
    return config;
  });
};
