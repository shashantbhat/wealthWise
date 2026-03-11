import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, {
    Easing,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withTiming,
} from "react-native-reanimated";

export function GradientBackground({
  children,
}: {
  children: React.ReactNode;
}) {
  const { width, height } = useWindowDimensions();

  // Animated blob positions
  const blob1X = useSharedValue(width * 0.2);
  const blob1Y = useSharedValue(height * 0.3);
  const blob2X = useSharedValue(width * 0.7);
  const blob2Y = useSharedValue(height * 0.2);
  const blob3X = useSharedValue(width * 0.8);
  const blob3Y = useSharedValue(height * 0.7);
  const blob4X = useSharedValue(width * 0.3);
  const blob4Y = useSharedValue(height * 0.8);

  useEffect(() => {
    // Animate blob 1 - Deep Navy
    blob1X.value = withRepeat(
      withTiming(width * 0.3, {
        duration: 8000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    blob1Y.value = withRepeat(
      withTiming(height * 0.4, {
        duration: 9000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    // Animate blob 2 - Forest Green
    blob2X.value = withRepeat(
      withTiming(width * 0.6, {
        duration: 7000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    blob2Y.value = withRepeat(
      withTiming(height * 0.3, {
        duration: 10000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    // Animate blob 3 - Gold
    blob3X.value = withRepeat(
      withTiming(width * 0.7, {
        duration: 8500,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    blob3Y.value = withRepeat(
      withTiming(height * 0.6, {
        duration: 9500,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    // Animate blob 4 - Teal (accent)
    blob4X.value = withRepeat(
      withTiming(width * 0.4, {
        duration: 9000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    blob4Y.value = withRepeat(
      withTiming(height * 0.7, {
        duration: 8000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  const animatedStyle1 = useAnimatedStyle(() => ({
    left: blob1X.value - width * 0.25,
    top: blob1Y.value - width * 0.25,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    left: blob2X.value - width * 0.25,
    top: blob2Y.value - width * 0.25,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    left: blob3X.value - width * 0.25,
    top: blob3Y.value - width * 0.25,
  }));

  const animatedStyle4 = useAnimatedStyle(() => ({
    left: blob4X.value - width * 0.25,
    top: blob4Y.value - width * 0.25,
  }));

  const blobRadius = width * 0.25;

  return (
    <View style={styles.container}>
      {/* Background with Linear Gradient */}
      <LinearGradient
        colors={["#FAFAF8", "#F5F3F0", "#F0EAEA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      />

      {/* Animated Blob 1 - Deep Navy */}
      <Animated.View
        style={[
          styles.blobContainer,
          animatedStyle1,
          { width: blobRadius * 2, height: blobRadius * 2 },
        ]}
      >
        <View
          style={[
            styles.blobCircle,
            {
              backgroundColor: "#1B2B5F",
              width: blobRadius * 2,
              height: blobRadius * 2,
            },
          ]}
        />
      </Animated.View>

      {/* Animated Blob 2 - Forest Green */}
      <Animated.View
        style={[
          styles.blobContainer,
          animatedStyle2,
          { width: blobRadius * 2.2, height: blobRadius * 2.2 },
        ]}
      >
        <View
          style={[
            styles.blobCircle,
            {
              backgroundColor: "#1F5D3F",
              width: blobRadius * 2.2,
              height: blobRadius * 2.2,
            },
          ]}
        />
      </Animated.View>

      {/* Animated Blob 3 - Gold */}
      <Animated.View
        style={[
          styles.blobContainer,
          animatedStyle3,
          { width: blobRadius * 2.1, height: blobRadius * 2.1 },
        ]}
      >
        <View
          style={[
            styles.blobCircle,
            {
              backgroundColor: "#D4A574",
              width: blobRadius * 2.1,
              height: blobRadius * 2.1,
            },
          ]}
        />
      </Animated.View>

      {/* Animated Blob 4 - Teal Accent */}
      <Animated.View
        style={[
          styles.blobContainer,
          animatedStyle4,
          { width: blobRadius * 1.9, height: blobRadius * 1.9 },
        ]}
      >
        <View
          style={[
            styles.blobCircle,
            {
              backgroundColor: "#2F7F7F",
              width: blobRadius * 1.9,
              height: blobRadius * 1.9,
            },
          ]}
        />
      </Animated.View>

      {/* Overlay for readability */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF8",
  },
  gradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  blobContainer: {
    position: "absolute",
  },
  blobCircle: {
    borderRadius: 9999,
    opacity: 0.4,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});
