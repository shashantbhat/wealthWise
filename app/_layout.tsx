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
import { AuthProvider } from "@/context/auth-context";
import { ExpenseProvider } from "@/context/expenseContextOptimized";
import { UserProvider } from "@/context/user-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { useLoadFonts } from "@/hooks/use-load-fonts";
import * as SplashScreen from "expo-splash-screen";

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "onboarding",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [onboardingDone, setOnboardingDone] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [fontsLoaded] = useLoadFonts();

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
        if (fontsLoaded) {
          SplashScreen.hideAsync();
          setIsLoading(false);
        }
      }
    };
    if (fontsLoaded) {
      checkOnboarding();
    }
  }, [fontsLoaded]);

  if (isLoading) {
    return (
      <GradientBackground>
        <StatusBar style="auto" />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <AuthProvider>
        <UserProvider>
          <ExpenseProvider>
            <ThemeProvider
              value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
              <Stack
                initialRouteName={onboardingDone ? "(tabs)" : "onboarding"}
              >
                <Stack.Screen
                  name="onboarding"
                  options={{ headerShown: false }}
                />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
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
      </AuthProvider>
    </GradientBackground>
  );
}
