// Patches expo-image's ContentPosition.swift to add @unchecked Sendable
// conformance, working around the Xcode 26 / Swift 6 strict-concurrency
// failure on `static let center = Self()`.

console.log('[bible-tour plugin] file loaded');

let withDangerousMod;
try {
  ({ withDangerousMod } = require('expo/config-plugins'));
  console.log('[bible-tour plugin] loaded withDangerousMod from expo/config-plugins');
} catch (e1) {
  try {
    ({ withDangerousMod } = require('@expo/config-plugins'));
    console.log('[bible-tour plugin] loaded withDangerousMod from @expo/config-plugins');
  } catch (e2) {
    console.error('[bible-tour plugin] FATAL: could not load config-plugins from either expo/config-plugins or @expo/config-plugins');
    console.error('[bible-tour plugin] expo error:', e1.message);
    console.error('[bible-tour plugin] @expo error:', e2.message);
    throw e1;
  }
}

const fs = require('fs');
const path = require('path');

const FROM = 'struct ContentPosition: Record {';
const TO = 'struct ContentPosition: Record, @unchecked Sendable {';

function findExpoImageSource(projectRoot) {
  const candidates = [];

  try {
    const pkg = require.resolve('expo-image/package.json', {
      paths: [projectRoot, __dirname, process.cwd()],
    });
    candidates.push(path.join(path.dirname(pkg), 'ios', 'ContentPosition.swift'));
  } catch (e) {
    console.warn('[bible-tour plugin] require.resolve(expo-image) failed:', e.message);
  }

  candidates.push(
    path.join(projectRoot, 'node_modules', 'expo-image', 'ios', 'ContentPosition.swift'),
    path.join(__dirname, '..', 'node_modules', 'expo-image', 'ios', 'ContentPosition.swift'),
    path.join(process.cwd(), 'node_modules', 'expo-image', 'ios', 'ContentPosition.swift'),
  );

  for (const p of candidates) {
    console.log('[bible-tour plugin] candidate:', p, fs.existsSync(p) ? 'EXISTS' : 'missing');
    if (fs.existsSync(p)) return p;
  }
  return null;
}

module.exports = function withExpoImagePatch(config) {
  console.log('[bible-tour plugin] withExpoImagePatch invoked at config-build time');
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      console.log('[bible-tour plugin] iOS dangerousMod running');
      console.log('[bible-tour plugin] projectRoot:', config.modRequest.projectRoot);

      const target = findExpoImageSource(config.modRequest.projectRoot);
      if (!target) {
        throw new Error('[bible-tour plugin] FATAL: expo-image ContentPosition.swift not found anywhere');
      }
      console.log('[bible-tour plugin] using target:', target);

      let contents = fs.readFileSync(target, 'utf8');

      if (contents.includes('@unchecked Sendable')) {
        console.log('[bible-tour plugin] expo-image already patched, nothing to do');
        return config;
      }

      if (!contents.includes(FROM)) {
        throw new Error('[bible-tour plugin] FATAL: expected source pattern not found in ' + target);
      }

      contents = contents.replace(FROM, TO);
      fs.writeFileSync(target, contents);

      const verify = fs.readFileSync(target, 'utf8');
      if (!verify.includes('@unchecked Sendable')) {
        throw new Error('[bible-tour plugin] FATAL: patch verification failed');
      }

      console.log('[bible-tour plugin] expo-image patched and verified');
      return config;
    },
  ]);
};
