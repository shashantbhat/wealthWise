/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from "react-native";

const tintColorLight = "#10605A";
const tintColorDark = "#fff";

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: tintColorDark,
  },
};

export const TabTheme = {
  background: "#F8F8F8",
  surface: "#FFFFFF",
  surfaceMuted: "#FAFAFA",
  text: "#1A1A1A",
  textMuted: "#777777",
  border: "#E8E8E8",
  accent: "#10605A",
  tabBarBg: "#13131E",
  tabBarBorder: "#1F1F2E",
  tabBarInactive: "#5A5A6E",
  tabBarActive: "#10605A",
};

export const Fonts = Platform.select({
  ios: {
    sans: "Inter",
    serif: "Inter",
    rounded: "Inter",
    mono: "Inter",
    thin: "Inter-Thin",
    extraLight: "Inter-ExtraLight",
    light: "Inter-Light",
    regular: "Inter-Regular",
    medium: "Inter-Medium",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
    extrabold: "Inter-ExtraBold",
    black: "Inter-Black",
  },
  android: {
    sans: "Inter",
    serif: "Inter",
    rounded: "Inter",
    mono: "Inter",
    thin: "Inter-Thin",
    extraLight: "Inter-ExtraLight",
    light: "Inter-Light",
    regular: "Inter-Regular",
    medium: "Inter-Medium",
    semibold: "Inter-SemiBold",
    bold: "Inter-Bold",
    extrabold: "Inter-ExtraBold",
    black: "Inter-Black",
  },
  web: {
    sans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Inter, Georgia, 'Times New Roman', serif",
    rounded: "Inter, 'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "Inter, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    thin: "Inter",
    extraLight: "Inter",
    light: "Inter",
    regular: "Inter",
    medium: "Inter",
    semibold: "Inter",
    bold: "Inter",
    extrabold: "Inter",
    black: "Inter",
  },
});

// Unified Typography System - All text uses Inter with consistent sizing and weight
export const Typography = {
  // Display: Extra large headings for main titles
  display: {
    fontFamily: "Inter",
    fontSize: 40,
    fontWeight: "700" as const,
    lineHeight: 48,
  },
  // H1: Main page headings
  h1: {
    fontFamily: "Inter",
    fontSize: 32,
    fontWeight: "700" as const,
    lineHeight: 40,
  },
  // H2: Section headings
  h2: {
    fontFamily: "Inter",
    fontSize: 28,
    fontWeight: "700" as const,
    lineHeight: 36,
  },
  // H3: Subsection headings
  h3: {
    fontFamily: "Inter",
    fontSize: 24,
    fontWeight: "700" as const,
    lineHeight: 32,
  },
  // H4: Small headings
  h4: {
    fontFamily: "Inter",
    fontSize: 20,
    fontWeight: "700" as const,
    lineHeight: 28,
  },
  // H5: Minor headings
  h5: {
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "700" as const,
    lineHeight: 26,
  },
  // H6: Tiny headings
  h6: {
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "700" as const,
    lineHeight: 24,
  },
  // Body: Default text
  body: {
    fontFamily: "Inter",
    fontSize: 16,
    fontWeight: "500" as const,
    lineHeight: 24,
  },
  // Body Medium: Slightly smaller body text
  bodyMedium: {
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "500" as const,
    lineHeight: 23,
  },
  // Body Small: Small body text
  bodySmall: {
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "500" as const,
    lineHeight: 21,
  },
  // Label: Label text
  label: {
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "700" as const,
    lineHeight: 20,
  },
  // Label Small: Tiny label text
  labelSmall: {
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "700" as const,
    lineHeight: 18,
  },
  // Caption: Very small text
  caption: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "600" as const,
    lineHeight: 16,
  },
  // Hint: Extra small text
  hint: {
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: "500" as const,
    lineHeight: 14,
  },
};
