import { Tabs } from 'expo-router';
import { Text } from 'react-native';
import { C } from '../../constants/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { backgroundColor: C.tealDark, borderTopColor: C.border },
        tabBarActiveTintColor: C.yellow,
        tabBarInactiveTintColor: C.textSecondary,
        headerStyle: { backgroundColor: C.tealDark },
        headerTintColor: C.yellow,
        headerTitleStyle: { fontWeight: '700' },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Tour',
          tabBarLabel: 'Tour',
          tabBarIcon: ({ color }) => <TabIcon label="📖" color={color} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="memory"
        options={{
          title: 'Memory',
          tabBarLabel: 'Memory',
          tabBarIcon: ({ color }) => <TabIcon label="★" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <TabIcon label="⚙" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ label, color }: { label: string; color: string }) {
  return <Text style={{ fontSize: 18, color }}>{label}</Text>;
}
