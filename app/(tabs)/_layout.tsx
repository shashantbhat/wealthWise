import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: "#14B8A6",
        tabBarInactiveTintColor: "#5A5A6E",
        tabBarStyle: {
          backgroundColor: "#13131E",
          borderTopColor: "#1F1F2E",
          borderTopWidth: 1,
          height: 72,
          paddingTop: 10,
          paddingBottom: 10,
        },
        tabBarItemStyle: {
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarLabelStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: "Goals",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={26} name="target" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="investments"
        options={{
          title: "Invest",
          tabBarIcon: ({ color }) => (
            <Ionicons name="trending-up-outline" size={26} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
