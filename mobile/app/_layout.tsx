import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { C } from '../constants/colors';

// Configure the iOS audio session up-front so ESV verse audio plays
// in the background and responds to lock-screen / Control Center
// transport controls. Required for the UIBackgroundModes:["audio"]
// entitlement we declare in app.json — Apple App Review checks that
// apps actually use the entitlement they ask for.
function configureAudioSession() {
  try {
    const { setAudioModeAsync } = require('expo-audio');
    setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    }).catch(() => {});
  } catch {
    // expo-audio not linked in this dev client build — ignored,
    // AudioPlayer.tsx already handles that case in its UI.
  }
}

export default function RootLayout() {
  useEffect(() => {
    configureAudioSession();
  }, []);

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
