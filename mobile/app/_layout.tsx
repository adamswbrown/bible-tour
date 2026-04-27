import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { C } from '../constants/colors';

export default function RootLayout() {
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
