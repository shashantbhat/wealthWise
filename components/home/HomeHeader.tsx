import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { getGreeting } from "../../app/utils/constants";

type Props = {
  userName: string;
  onProfilePress: () => void;
};

export function HomeHeader({ userName, onProfilePress }: Props) {
  const [dateTime, setDateTime] = useState({
    date: "",
    time: "",
  });

  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();

      // Format date: e.g., "December 12, 2024"
      const dateStr = now.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Format time: e.g., "1:45 PM"
      const timeStr = now.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      setDateTime({ date: dateStr, time: timeStr });
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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
      <View style={styles.dateTimeRow}>
        <Text style={styles.dateTime}>
          {dateTime.date} • {dateTime.time}
        </Text>
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
  dateTimeRow: { marginTop: 8 },
  dateTime: { color: "#999999", fontSize: 14 },
});
