import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_ICONS, formatINR } from "../../app/utils/constants";
import { ReportType } from "./types";

type Props = {
  spendingByCategory: Record<string, number>;
  totalSpent: number;
  budgets: Record<string, number>;
  reportType: ReportType;
  hideAmounts: boolean;
  onPress?: () => void;
};

export function InsightsSection({
  spendingByCategory,
  totalSpent,
  budgets,
  reportType,
  hideAmounts,
  onPress,
}: Props) {
  const displayAmount = (amount: number) =>
    hideAmounts ? "₹ ----" : formatINR(amount);

  const totalSpentValue = Math.max(0, totalSpent || 0);
  const categoriesWithExpenses = Object.entries(spendingByCategory).filter(
    ([, amount]) => amount > 0,
  );

  // Calculate adjusted budget for each category based on report type
  const getAdjustedBudget = (category: string, monthlyBudget: number) => {
    switch (reportType) {
      case "weekly":
        return monthlyBudget / 4;
      case "yearly":
        return monthlyBudget * 12;
      case "monthly":
      default:
        return monthlyBudget;
    }
  };

  return (
    <>
      <TouchableOpacity onPress={onPress}>
        <Text style={styles.sectionTitle}>Insights</Text>
      </TouchableOpacity>
      {categoriesWithExpenses.length === 0 ? (
        <Text style={styles.emptyText}>No expenses to analyze</Text>
      ) : (
        <TouchableOpacity onPress={onPress} style={styles.insightsContainer}>
          {categoriesWithExpenses
            .sort((a, b) => b[1] - a[1])
            .map(([category, amount]) => {
              const monthlyBudget = budgets[category] || 0;
              const adjustedBudget = getAdjustedBudget(category, monthlyBudget);
              const budgetPct =
                adjustedBudget > 0 ? (amount / adjustedBudget) * 100 : 0;
              const totalPct =
                totalSpentValue > 0 ? (amount / totalSpentValue) * 100 : 0;
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
                          { width: `${Math.min(budgetPct, 100)}%` },
                          budgetPct > 100 && styles.overBudget,
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.insightAmount}>
                    <Text style={styles.insightAmountValue}>
                      {displayAmount(amount)}
                    </Text>
                    <Text
                      style={[
                        styles.insightPercentage,
                        budgetPct > 100 && styles.overBudgetText,
                      ]}
                    >
                      {Math.round(budgetPct)}%
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
  overBudget: {
    backgroundColor: "#FF4444",
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
  overBudgetText: {
    color: "#FF4444",
  },
});
