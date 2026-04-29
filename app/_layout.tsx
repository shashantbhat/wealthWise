import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import "react-native-reanimated";
import "../global.css";

import { loadCategories } from "@/app/utils/constants";
import { isOnboardingComplete } from "@/app/utils/userContextStorage";
import { GradientBackground } from "@/components/gradient-background";
import { ExpenseProvider } from "@/context/expenseContextOptimized";
import { UserProvider } from "@/context/user-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "onboarding",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const isComplete = await isOnboardingComplete();
        setOnboardingDone(isComplete);
        // Load categories on app start
        await loadCategories();
      } catch (error) {
        console.error("Error checking onboarding status:", error);
        setOnboardingDone(false);
      } finally {
        setIsLoading(false);
      }
    };
    checkOnboarding();
  }, []);

  if (isLoading) {
    return (
      <GradientBackground>
        <StatusBar style="auto" />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <UserProvider>
        <ExpenseProvider>
          <ThemeProvider
            value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
          >
            <Stack initialRouteName="onboarding">
              <Stack.Screen
                name="onboarding"
                options={{ headerShown: false }}
              />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen
                name="modal"
                options={{ presentation: "modal", title: "Modal" }}
              />
              <Stack.Screen
                name="profile"
                options={{
                  headerShown: false,
                  animation: "slide_from_right",
                }}
              />
            </Stack>
            <StatusBar style="auto" />
          </ThemeProvider>
        </ExpenseProvider>
      </UserProvider>
    </GradientBackground>
  );
}
