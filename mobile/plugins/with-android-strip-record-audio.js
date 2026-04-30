const { withAndroidManifest } = require('@expo/config-plugins');

const TARGETS = [
  'android.permission.RECORD_AUDIO',
  'android.permission.MODIFY_AUDIO_SETTINGS',
];

module.exports = function withAndroidStripRecordAudio(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults.manifest;
    manifest.$['xmlns:tools'] = manifest.$['xmlns:tools'] || 'http://schemas.android.com/tools';
    manifest['uses-permission'] = manifest['uses-permission'] || [];
    for (const name of TARGETS) {
      const existing = manifest['uses-permission'].find((p) => p.$['android:name'] === name);
      if (existing) {
        existing.$['tools:node'] = 'remove';
      } else {
        manifest['uses-permission'].push({
          $: { 'android:name': name, 'tools:node': 'remove' },
        });
      }
    }
    return cfg;
  });
};
