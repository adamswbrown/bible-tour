// Disables Swift 6 strict concurrency for all CocoaPods targets.
//
// Why: Xcode 26 (SDK iPhoneOS26) enforces Swift 6 strict concurrency,
// which trips on `static let` properties in non-Sendable Records inside
// expo-image (a transitive dep of expo-dev-launcher) and other unpatched
// pods. Setting SWIFT_STRICT_CONCURRENCY = 'minimal' restores the
// pre-Swift-6 behaviour for pod targets without affecting our app code.
//
// Remove this plugin once all upstream Expo modules ship Swift 6 fixes.

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const HOOK = `
    # Injected by withSwiftConcurrencyFix — disables Swift 6 strict
    # concurrency for pod targets that haven't been patched upstream.
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |build_config|
        build_config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
      end
    end`;

module.exports = function withSwiftConcurrencyFix(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        'Podfile',
      );
      let contents = fs.readFileSync(podfilePath, 'utf-8');

      if (contents.includes('withSwiftConcurrencyFix')) {
        return config;
      }

      contents = contents.replace(
        /post_install do \|installer\|/,
        `post_install do |installer|${HOOK}`,
      );

      fs.writeFileSync(podfilePath, contents);
      return config;
    },
  ]);
};
