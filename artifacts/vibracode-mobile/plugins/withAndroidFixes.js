const path = require("path");

// Resolve @expo/config-plugins from pnpm store or local install
let withAndroidManifest;
try {
  withAndroidManifest = require("@expo/config-plugins").withAndroidManifest;
} catch {
  try {
    const pluginsPath = require.resolve("@expo/config-plugins", {
      paths: [
        path.join(__dirname, ".."),
        path.join(__dirname, "../node_modules"),
        path.join(__dirname, "../../.."),
        "/home/runner/workspace/node_modules/.pnpm/node_modules",
      ],
    });
    withAndroidManifest = require(pluginsPath).withAndroidManifest;
  } catch (e) {
    // If we still can't find it, return a pass-through
    module.exports = (config) => config;
    return;
  }
}

function withExportedProviders(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;
    const application = manifest.manifest.application?.[0];
    if (!application) return config;

    const providers = application.provider ?? [];
    providers.forEach((provider) => {
      if (provider.$) {
        if (provider.$["android:exported"] === undefined) {
          provider.$["android:exported"] = "false";
        }
      }
    });

    application.provider = providers;
    return config;
  });
}

module.exports = withExportedProviders;
