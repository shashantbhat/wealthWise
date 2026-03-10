import React from "react";
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TouchableOpacity,
    ViewStyle,
} from "react-native";

export type ButtonVariant = "primary" | "secondary" | "outline";

interface ButtonProps {
  /** Label displayed inside the button */
  text: string;
  /** Action fired when the button is pressed */
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function Button({
  text,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.base,
        styles[variant],
        isDisabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "primary" ? "#0D0D1A" : "#00D09C"}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.label,
            variant === "primary" && styles.labelPrimary,
            variant === "secondary" && styles.labelSecondary,
            variant === "outline" && styles.labelOutline,
          ]}
        >
          {text}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 54,
  },
  primary: {
    backgroundColor: "#00D09C",
  },
  secondary: {
    backgroundColor: "#1A1A2E",
    borderWidth: 1.5,
    borderColor: "#2A2A3E",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: "#00D09C",
  },
  disabled: {
    opacity: 0.38,
  },
  label: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  labelPrimary: {
    color: "#0D0D1A",
  },
  labelSecondary: {
    color: "#EDEDED",
  },
  labelOutline: {
    color: "#00D09C",
  },
});
