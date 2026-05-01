import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Animated, Modal, StyleSheet, Text, View } from "react-native";

interface SuccessModalProps {
  visible: boolean;
  message: string;
  onDismiss?: () => void;
  duration?: number; // Auto-dismiss after duration in ms (0 = no auto-dismiss)
}

export function SuccessModal({
  visible,
  message,
  onDismiss,
  duration = 2500,
}: SuccessModalProps) {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();

      // Auto-dismiss if duration > 0
      if (duration > 0) {
        const timer = setTimeout(() => {
          Animated.timing(scaleAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            onDismiss?.();
          });
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible, duration, scaleAnim, onDismiss]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <View style={styles.backdrop}>
        <Animated.View
          style={[
            styles.container,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Green Checkmark Circle */}
          <View style={styles.checkCircle}>
            <MaterialCommunityIcons
              name="check"
              size={48}
              color="#fff"
              style={styles.checkIcon}
            />
          </View>

          {/* Message */}
          <Text style={styles.message}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    minWidth: 240,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "transparent",
    borderWidth: 3,
    borderColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  checkIcon: {
    fontWeight: "bold",
  },
  message: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    textAlign: "center",
  },
});
