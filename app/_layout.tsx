import {
    DarkTheme,
    DefaultTheme,
    ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";
import "../global.css";

import { GradientBackground } from "@/components/gradient-background";
import { ExpenseProvider } from "@/context/expenseContextOptimized";
import { UserProvider } from "@/context/user-context";
import { useColorScheme } from "@/hooks/use-color-scheme";

export const unstable_settings = {
  anchor: "onboarding",
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
