import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HapticTab } from "@/components/haptic-tab";

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: "#3B82F6",
        tabBarInactiveTintColor: "#64748B",

        tabBarStyle: {
          backgroundColor: "#F1F5F9",
          borderTopWidth: 1,
          borderTopColor: "#E5E7EB",

          height: 55, // tinggi tetap
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          paddingTop: 4,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },

        tabBarItemStyle: {
          paddingVertical: 2,
        },

        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons name="home" size={22} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="akun"
        options={{
          title: "Akun",
          tabBarIcon: ({ color }) => (
            <Ionicons name="person-circle" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
