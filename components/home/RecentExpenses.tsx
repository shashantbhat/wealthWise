import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CATEGORY_ICONS, formatINR } from "./constants";
import { Expense } from "./types";

type Props = {
  expenses: Expense[];
  hideAmounts: boolean;
  onToggleHide: () => void;
};

export function RecentExpenses({ expenses, hideAmounts, onToggleHide }: Props) {
  const displayAmount = (amount: number) =>
    hideAmounts ? "₹ ----" : formatINR(amount);

  return (
    <>
      <View style={styles.expensesHeaderRow}>
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        <TouchableOpacity style={styles.hideExpensesBtn} onPress={onToggleHide}>
          <Ionicons
            name={hideAmounts ? "eye-outline" : "eye-off-outline"}
            size={20}
            color="#666666"
          />
        </TouchableOpacity>
      </View>

      {expenses.length === 0 ? (
        <Text style={styles.emptyText}>No expenses logged yet</Text>
      ) : (
        expenses.map((exp) => (
          <View key={exp.id} style={styles.expenseRow}>
            <View style={styles.expenseCategoryIcon}>
              <Ionicons
                name={CATEGORY_ICONS[exp.category] ?? "card-outline"}
                size={20}
                color="#555"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.expenseDesc}>{exp.description}</Text>
              <Text style={styles.expenseMeta}>
                {exp.category} · {exp.date}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>
              − {displayAmount(exp.amount)}
            </Text>
          </View>
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  expensesHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "#1A1A1A",
    fontSize: 18,
    fontWeight: "700",
  },
  hideExpensesBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  expenseCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  expenseDesc: { color: "#1A1A1A", fontSize: 15, fontWeight: "500" },
  expenseMeta: { color: "#999999", fontSize: 12, marginTop: 2 },
  expenseAmount: { color: "#FF6B6B", fontSize: 15, fontWeight: "600" },
  emptyText: {
    color: "#999999",
    fontSize: 14,
    textAlign: "center",
    marginTop: 12,
  },
});
