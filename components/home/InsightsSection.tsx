import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_ICONS, formatINR } from "./constants";

type Props = {
  spendingByCategory: Record<string, number>;
  monthlySpent: number;
  hideAmounts: boolean;
  onPress?: () => void;
};

export function InsightsSection({
  spendingByCategory,
  monthlySpent,
  hideAmounts,
  onPress,
}: Props) {
  const displayAmount = (amount: number) =>
    hideAmounts ? "₹ ----" : formatINR(amount);

  return (
    <>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.sectionTitle}>Insights</Text>
      </TouchableOpacity>
      {Object.keys(spendingByCategory).length === 0 ? (
        <Text style={styles.emptyText}>No expenses to analyze</Text>
      ) : (
        <TouchableOpacity onPress={onPress} style={styles.insightsContainer}>
          {Object.entries(spendingByCategory)
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => {
              const pct = (amount / monthlySpent) * 100;
              return (
                <View key={category} style={styles.insightItem}>
                  <View style={styles.insightCategoryInfo}>
                    <View style={styles.insightCategory}>
                      <Ionicons
                        name={CATEGORY_ICONS[category] ?? "card-outline"}
                        size={14}
                        color="#555"
                      />
                      <Text style={styles.insightCategoryText}>{category}</Text>
                    </View>
                    <View style={styles.insightProgressBar}>
                      <View
                        style={[
                          styles.insightProgressFill,
                          { width: `${pct}%` },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.insightAmount}>
                    <Text style={styles.insightAmountValue}>
                      {displayAmount(amount)}
                    </Text>
                    <Text style={styles.insightPercentage}>
                      {Math.round(pct)}%
                    </Text>
                  </View>
                </View>
              );
            })}
        </TouchableOpacity>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    color: "#1A1A1A",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 30,
    marginBottom: 12,
  },
  emptyText: {
    color: "#999999",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },
  insightsContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  insightItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
  },
  insightCategoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  insightCategory: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  insightCategoryText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  insightProgressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  insightProgressFill: {
    height: "100%",
    backgroundColor: "#1A1A1A",
    borderRadius: 3,
  },
  insightAmount: {
    alignItems: "flex-end",
  },
  insightAmountValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  insightPercentage: {
    fontSize: 12,
    color: "#999999",
    fontWeight: "600",
    marginTop: 2,
  },
});
