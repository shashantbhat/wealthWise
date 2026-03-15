import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ReportType } from "./types";

type Props = {
  selectedReportType: ReportType;
  onTabPress: (type: ReportType) => void;
  onBudgetPress: () => void;
  exceededBudgetsCount: number;
  onAlertPress: () => void;
};

export function ReportTabs({
  selectedReportType,
  onTabPress,
  onBudgetPress,
  exceededBudgetsCount,
  onAlertPress,
}: Props) {
  return (
    <View style={styles.reportTabsRow}>
      <View style={styles.reportTabs}>
        {(["Weekly", "Monthly", "Yearly"] as const).map((tab) => {
          const type = tab.toLowerCase() as ReportType;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.reportTab,
                selectedReportType === type && styles.reportTabActive,
              ]}
              onPress={() => onTabPress(type)}
            >
              <Text
                style={[
                  styles.reportTabText,
                  selectedReportType === type && styles.reportTabTextActive,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
        <TouchableOpacity style={styles.reportTab} onPress={onBudgetPress}>
          <Text style={styles.reportTabText}>Budget</Text>
        </TouchableOpacity>
      </View>

      {exceededBudgetsCount > 0 ? (
        <TouchableOpacity
          style={[styles.notifBtn, styles.notifBtnAlert]}
          onPress={onAlertPress}
        >
          <Ionicons name="notifications-outline" size={20} color="#1A1A1A" />
          <View style={styles.notifBadge}>
            <Text style={styles.notifBadgeText}>{exceededBudgetsCount}</Text>
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={20} color="#CCCCCC" />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  reportTabsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 14,
    marginBottom: 4,
  },
  reportTabs: {
    flexDirection: "row",
    gap: 6,
  },
  reportTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  reportTabActive: {
    backgroundColor: "#1A1A1A",
  },
  reportTabText: {
    color: "#666666",
    fontSize: 13,
    fontWeight: "600",
  },
  reportTabTextActive: {
    color: "#FFFFFF",
  },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  notifBtnAlert: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
});
