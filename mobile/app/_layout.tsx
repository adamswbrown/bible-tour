import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { C } from '../constants/colors';

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
  useEffect(() => {
    configureAudioSession();
  }, []);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((resp) => {
      const data = resp.notification.request.content.data as { type?: string };
      if (data?.type === 'memory-reminder') {
        router.push({ pathname: '/(tabs)/memory', params: { autoplay: '1' } });
      }
    });
    return () => sub.remove();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: C.tealDark },
          headerTintColor: C.yellow,
          headerTitleStyle: { fontWeight: '700' },
          headerBackButtonDisplayMode: 'minimal',
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
    </GestureHandlerRootView>
  );
}
