import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getGreeting } from "./constants";

type Props = {
  userName: string;
  onProfilePress: () => void;
};

export function HomeHeader({ userName, onProfilePress }: Props) {
  return (
    <>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={onProfilePress}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarLetter}>
              {userName ? userName.charAt(0).toUpperCase() : "U"}
            </Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.greetingRow}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.userName}> {userName || "User"}</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 18,
    paddingBottom: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { color: "#FFFFFF", fontSize: 22, fontWeight: "800" },
  greetingRow: { flexDirection: "row" },
  greeting: { color: "#999999", fontSize: 22 },
  userName: { color: "#1A1A1A", fontSize: 22, fontWeight: "700" },
});
