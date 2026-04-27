// Patches expo-image's ContentPosition.swift to add @unchecked Sendable
// conformance, working around the Xcode 26 / Swift 6 strict-concurrency
// failure on `static let center = Self()`.
//
// This runs from both the npm `postinstall` hook (local dev) and the
// EAS `eas-build-post-install` hook (cloud builds), so the fix lands
// on every machine regardless of which install path is used.

const fs = require('fs');
const path = require('path');

const TARGET = path.join(
  __dirname,
  '..',
  'node_modules',
  'expo-image',
  'ios',
  'ContentPosition.swift',
);

const FROM = 'struct ContentPosition: Record {';
const TO = 'struct ContentPosition: Record, @unchecked Sendable {';

console.log('[bible-tour patch] starting expo-image patch');
console.log('[bible-tour patch] target:', TARGET);

if (!fs.existsSync(TARGET)) {
  console.warn(
    '[bible-tour patch] expo-image source file not found — skipping ' +
      '(this is fine if expo-image was uninstalled)',
  );
  process.exit(0);
}

let contents = fs.readFileSync(TARGET, 'utf8');

if (contents.includes('@unchecked Sendable')) {
  console.log('[bible-tour patch] expo-image already patched, nothing to do');
  process.exit(0);
}

if (!contents.includes(FROM)) {
  console.error(
    '[bible-tour patch] FATAL: expected source pattern not found in',
    TARGET,
  );
  console.error('[bible-tour patch] the upstream file may have changed.');
  process.exit(1);
}

contents = contents.replace(FROM, TO);
fs.writeFileSync(TARGET, contents);

const verify = fs.readFileSync(TARGET, 'utf8');
if (!verify.includes('@unchecked Sendable')) {
  console.error('[bible-tour patch] FATAL: patch verification failed');
  process.exit(1);
}

console.log('[bible-tour patch] expo-image patched and verified');
