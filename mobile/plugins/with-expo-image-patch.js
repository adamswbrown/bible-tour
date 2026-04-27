// Two-pronged fix for expo-image Swift 6 / Xcode 26 incompatibility:
//
// 1. Source patch: ContentPosition.swift gets @unchecked Sendable on the
//    Record struct so its `static let center = Self()` compiles. This was
//    the first error we hit and the patch is proven to work.
//
// 2. Podfile mod: a post_install hook downgrades the ExpoImage Pod target
//    to SWIFT_VERSION = 5.0 with SWIFT_STRICT_CONCURRENCY = minimal,
//    silencing the rest of the Swift 6 errors (sending closures, Sendable
//    captures, etc.) without affecting our app's own Swift code.
//
// Remove this whole plugin once expo-image upstream ships a Swift 6 /
// Xcode 26 compatible release.

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
    console.error('[bible-tour plugin] FATAL: could not load config-plugins');
    console.error('[bible-tour plugin] expo error:', e1.message);
    console.error('[bible-tour plugin] @expo error:', e2.message);
    throw e1;
  }
}

const fs = require('fs');
const path = require('path');

const SOURCE_FROM = 'struct ContentPosition: Record {';
const SOURCE_TO = 'struct ContentPosition: Record, @unchecked Sendable {';

const PODFILE_MARKER = 'Injected by withExpoImagePatch';
const PODFILE_HOOK = `
    # ${PODFILE_MARKER} — downgrades ExpoImage to Swift 5 mode so that
    # Swift 6 strict-concurrency errors in expo-image's source (static let,
    # sending closures, etc.) don't break the build under Xcode 26.
    installer.pods_project.targets.each do |target|
      next unless target.name == 'ExpoImage'
      target.build_configurations.each do |build_config|
        build_config.build_settings['SWIFT_VERSION'] = '5.0'
        build_config.build_settings['SWIFT_STRICT_CONCURRENCY'] = 'minimal'
      end
    end`;

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

function patchSource(projectRoot) {
  const target = findExpoImageSource(projectRoot);
  if (!target) {
    console.warn('[bible-tour plugin] expo-image source not found, skipping source patch');
    return;
  }

  let contents = fs.readFileSync(target, 'utf8');

  if (contents.includes('@unchecked Sendable')) {
    console.log('[bible-tour plugin] ContentPosition.swift already patched');
    return;
  }

  if (!contents.includes(SOURCE_FROM)) {
    console.warn('[bible-tour plugin] ContentPosition pattern not found, skipping');
    return;
  }

  contents = contents.replace(SOURCE_FROM, SOURCE_TO);
  fs.writeFileSync(target, contents);
  console.log('[bible-tour plugin] ContentPosition.swift patched');
}

function patchPodfile(platformProjectRoot) {
  const podfilePath = path.join(platformProjectRoot, 'Podfile');
  console.log('[bible-tour plugin] Podfile path:', podfilePath);

  if (!fs.existsSync(podfilePath)) {
    throw new Error('[bible-tour plugin] FATAL: Podfile not found at ' + podfilePath);
  }

  let contents = fs.readFileSync(podfilePath, 'utf8');

  if (contents.includes(PODFILE_MARKER)) {
    console.log('[bible-tour plugin] Podfile already patched');
    return;
  }

  const before = contents.length;
  contents = contents.replace(
    /post_install do \|installer\|/,
    `post_install do |installer|${PODFILE_HOOK}`,
  );

  if (contents.length === before) {
    throw new Error('[bible-tour plugin] FATAL: post_install block not found in Podfile');
  }

  fs.writeFileSync(podfilePath, contents);
  console.log('[bible-tour plugin] Podfile patched with ExpoImage Swift 5 override');
}

module.exports = function withExpoImagePatch(config) {
  console.log('[bible-tour plugin] withExpoImagePatch invoked at config-build time');
  return withDangerousMod(config, [
    'ios',
    async (config) => {
      console.log('[bible-tour plugin] iOS dangerousMod running');
      console.log('[bible-tour plugin] projectRoot:', config.modRequest.projectRoot);
      console.log('[bible-tour plugin] platformProjectRoot:', config.modRequest.platformProjectRoot);

      patchSource(config.modRequest.projectRoot);
      patchPodfile(config.modRequest.platformProjectRoot);

      console.log('[bible-tour plugin] all patches applied');
      return config;
    },
  ]);
};
