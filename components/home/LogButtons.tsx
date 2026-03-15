import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  onVoiceLog: () => void;
  onManualLog: () => void;
};

export function LogButtons({ onVoiceLog, onManualLog }: Props) {
  return (
    <View style={styles.logButtonsContainer}>
      <TouchableOpacity
        style={styles.logBtn}
        onPress={onVoiceLog}
        activeOpacity={0.75}
      >
        <Ionicons
          name="mic-outline"
          size={28}
          color="#1A1A1A"
          style={styles.logBtnIcon}
        />
        <Text style={styles.logBtnTitle}>Voice Log</Text>
        <Text style={styles.logBtnSub}>Speak expense</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.logBtn}
        onPress={onManualLog}
        activeOpacity={0.75}
      >
        <Ionicons
          name="create-outline"
          size={28}
          color="#1A1A1A"
          style={styles.logBtnIcon}
        />
        <Text style={styles.logBtnTitle}>Manual Log</Text>
        <Text style={styles.logBtnSub}>Type expense</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  logButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
    marginBottom: 24,
  },
  logBtn: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 0.5,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  logBtnIcon: {
    marginBottom: 8,
  },
  logBtnTitle: {
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  logBtnSub: {
    color: "#999999",
    fontSize: 11,
  },
});
