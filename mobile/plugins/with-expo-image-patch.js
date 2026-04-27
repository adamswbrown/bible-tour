// Patches expo-image's ContentPosition.swift to add @unchecked Sendable
// conformance, working around the Xcode 26 / Swift 6 strict-concurrency
// failure on `static let center = Self()`.
//
// This is implemented as an Expo config plugin (rather than an npm
// postinstall hook) because EAS Cloud's `npm ci` step is skipping
// lifecycle scripts. Config plugins are guaranteed to run during
// `expo prebuild`, which EAS invokes between npm install and pod
// install — exactly when we need the patch in place.

const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const FROM = 'struct ContentPosition: Record {';
const TO = 'struct ContentPosition: Record, @unchecked Sendable {';

function patchExpoImage(projectRoot) {
  const target = path.join(
    projectRoot,
    'node_modules',
    'expo-image',
    'ios',
    'ContentPosition.swift',
  );

  console.log('[bible-tour plugin] target:', target);

  if (!fs.existsSync(target)) {
    console.warn('[bible-tour plugin] expo-image source not found — skipping');
    return;
  }

  let contents = fs.readFileSync(target, 'utf8');

  if (contents.includes('@unchecked Sendable')) {
    console.log('[bible-tour plugin] expo-image already patched');
    return;
  }

  if (!contents.includes(FROM)) {
    throw new Error(
      '[bible-tour plugin] expected source pattern not found in ' +
        target +
        ' — upstream may have changed.',
    );
  }

  contents = contents.replace(FROM, TO);
  fs.writeFileSync(target, contents);

  const verify = fs.readFileSync(target, 'utf8');
  if (!verify.includes('@unchecked Sendable')) {
    throw new Error('[bible-tour plugin] patch verification failed');
  }

  console.log('[bible-tour plugin] expo-image patched and verified');
}

module.exports = function withExpoImagePatch(config) {
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      console.log('[bible-tour plugin] running expo-image patch during prebuild');
      patchExpoImage(config.modRequest.projectRoot);
      return config;
    },
  ]);
};
