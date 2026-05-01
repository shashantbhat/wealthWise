import * as Font from "expo-font";
import { useState, useEffect } from "react";

export const useLoadFonts = () => {
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    const loadFonts = async () => {
      try {
        await Font.loadAsync({
          "Inter-Thin": require("../assets/fonts/Inter-Thin.ttf"),
          "Inter-ExtraLight": require("../assets/fonts/Inter-ExtraLight.ttf"),
          "Inter-Light": require("../assets/fonts/Inter-Light.ttf"),
          "Inter-Regular": require("../assets/fonts/Inter-Regular.ttf"),
          Inter: require("../assets/fonts/Inter-Regular.ttf"),
          "Inter-Medium": require("../assets/fonts/Inter-Medium.ttf"),
          "Inter-SemiBold": require("../assets/fonts/Inter-SemiBold.ttf"),
          "Inter-Bold": require("../assets/fonts/Inter-Bold.ttf"),
          "Inter-ExtraBold": require("../assets/fonts/Inter-ExtraBold.ttf"),
          "Inter-Black": require("../assets/fonts/Inter-Black.ttf"),
        });
        setFontsLoaded(true);
      } catch (e) {
        console.warn("Error loading fonts:", e);
        setFontsLoaded(true);
      }
    };
    loadFonts();
  }, []);

  return [fontsLoaded];
};
