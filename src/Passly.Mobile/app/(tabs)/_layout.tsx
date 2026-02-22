import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { colors, fontSize, fontWeight } from '@/constants/design-tokens';

export default function TabsLayout() {
  const scheme = useColorScheme() ?? 'light';
  const t = colors[scheme];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.primary,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          borderTopWidth: StyleSheet.hairlineWidth,
        },
        tabBarLabelStyle: {
          fontSize: fontSize.xs,
          fontWeight: fontWeight.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tutorial"
        options={{
          title: 'Tutorial',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="school" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="settings" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
