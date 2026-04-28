import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Text, TextInput } from 'react-native';
import { useFonts } from 'expo-font';
import { C } from '../constants/colors';
import * as verseCache from '../lib/verse-cache';

// Default body text to bundled DM Sans Regular. Individual styles can still
// override with `fontFamily: 'DMSans-Bold' | 'Oswald-SemiBold' | ...`.
function applyDefaultFont() {
  const defaults = { style: { fontFamily: 'DMSans-Regular' } } as const;
  // @ts-expect-error — defaultProps exists on these RN components at runtime
  Text.defaultProps = { ...(Text.defaultProps || {}), ...defaults };
  // @ts-expect-error — same
  TextInput.defaultProps = { ...(TextInput.defaultProps || {}), ...defaults };
}

// Configure the iOS audio session up-front so ESV verse audio plays
// in the background, through the loud speaker (not the earpiece), and
// responds to lock-screen / Control Center transport controls.
// Required for the UIBackgroundModes:["audio"] entitlement we declare
// in app.json — Apple App Review checks that apps actually use the
// entitlement they ask for.
function configureAudioSession() {
  try {
    const { setAudioModeAsync } = require('expo-audio');
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      // Explicit: this is a media-playback app, not a VoIP app. Route
      // audio through the loudspeaker by default. Without this the
      // session can fall through to the earpiece and users only hear
      // sound via Bluetooth / headphones.
      shouldRouteThroughEarpiece: false,
      allowsRecording: false,
    }).catch(() => {});
  } catch {
    // expo-audio not linked in this dev client build — ignored,
    // AudioPlayer.tsx already handles that case in its UI.
  }
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    'DMSans-Regular': require('../assets/fonts/DMSans-Regular.ttf'),
    'DMSans-Medium': require('../assets/fonts/DMSans-Medium.ttf'),
    'DMSans-Bold': require('../assets/fonts/DMSans-Bold.ttf'),
    'Oswald-Medium': require('../assets/fonts/Oswald-Medium.ttf'),
    'Oswald-SemiBold': require('../assets/fonts/Oswald-SemiBold.ttf'),
  });

  useEffect(() => {
    configureAudioSession();
    verseCache.hydrate();
  }, []);

  useEffect(() => {
    if (fontsLoaded) applyDefaultFont();
  }, [fontsLoaded]);

  // Keep the splash screen visible until fonts have loaded so the first
  // frame of UI is rendered in the brand font, not a system fallback.
  if (!fontsLoaded) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.tealDark },
          headerTintColor: C.yellow,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: C.tealDark },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="verse"
          options={{
            title: 'Passage',
            presentation: 'modal',
            headerStyle: { backgroundColor: C.teal },
          }}
        />
        <Stack.Screen
          name="about"
          options={{ title: 'About & Credits' }}
        />
      </Stack>
    </>
  );
}
