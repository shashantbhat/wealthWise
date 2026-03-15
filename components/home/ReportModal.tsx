import { Button } from "@/components/ui/primary-button";
import React from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatINR } from "./constants";
import { Expense, ReportType } from "./types";

type Props = {
  visible: boolean;
  onClose: () => void;
  selectedReportType: ReportType;
  expenses: Expense[];
  hideAmounts: boolean;
};

function getDateRange(type: ReportType) {
  const today = new Date();
  const start = new Date();
  if (type === "weekly") {
    start.setDate(today.getDate() - 7);
  } else if (type === "monthly") {
    start.setMonth(today.getMonth());
    start.setDate(1);
  } else {
    start.setFullYear(today.getFullYear());
    start.setMonth(0);
    start.setDate(1);
  }
  return { start, end: today };
}

function buildReport(type: ReportType, expenses: Expense[]) {
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const categoryBreakdown = expenses.reduce(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  const { start } = getDateRange(type);
  const dateRange =
    type === "weekly"
      ? "Last 7 days"
      : type === "monthly"
        ? start.toLocaleDateString("en-US", { month: "long" })
        : `Year ${start.getFullYear()}`;

  return {
    totalSpent,
    categoryBreakdown,
    dateRange,
    expenseCount: expenses.length,
    averagePerDay:
      totalSpent / (type === "weekly" ? 7 : type === "monthly" ? 30 : 365),
  };
}

export function ReportModal({
  visible,
  onClose,
  selectedReportType,
  expenses,
  hideAmounts,
}: Props) {
  const displayAmount = (amount: number) =>
    hideAmounts ? "₹ ----" : formatINR(amount);

  const report = buildReport(selectedReportType, expenses);

  const titleMap: Record<ReportType, string> = {
    weekly: "Weekly Report",
    monthly: "Monthly Report",
    yearly: "Yearly Report",
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{titleMap[selectedReportType]}</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.reportSummary}>
              {[
                { label: "Period", value: report.dateRange },
                {
                  label: "Total Spent",
                  value: displayAmount(report.totalSpent),
                },
                { label: "Transactions", value: String(report.expenseCount) },
                {
                  label: "Daily Average",
                  value: displayAmount(report.averagePerDay),
                },
              ].map(({ label, value }) => (
                <View key={label} style={styles.reportSummaryItem}>
                  <Text style={styles.reportSummaryLabel}>{label}</Text>
                  <Text style={styles.reportSummaryValue}>{value}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.reportSectionTitle}>Category Breakdown</Text>

            {Object.keys(report.categoryBreakdown).length === 0 ? (
              <Text style={styles.reportEmptyText}>
                No expenses in this period
              </Text>
            ) : (
              Object.entries(report.categoryBreakdown).map(
                ([category, amount]) => {
                  const pct = (amount / report.totalSpent) * 100;
                  return (
                    <View key={category} style={styles.reportCategoryItem}>
                      <View style={styles.reportCategoryInfo}>
                        <Text style={styles.reportCategoryName}>
                          {category}
                        </Text>
                        <View style={styles.reportCategoryProgressBar}>
                          <View
                            style={[
                              styles.reportCategoryProgressFill,
                              { width: `${pct}%` },
                            ]}
                          />
                        </View>
                      </View>
                      <View style={styles.reportCategoryAmount}>
                        <Text style={styles.reportCategoryValue}>
                          {displayAmount(amount)}
                        </Text>
                        <Text style={styles.reportCategoryPercent}>
                          {Math.round(pct)}%
                        </Text>
                      </View>
                    </View>
                  );
                },
              )
            )}
          </ScrollView>

          <View style={styles.modalButtons}>
            <Button text="Close" onPress={onClose} style={styles.modalButton} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 20,
    textAlign: "center",
  },
  reportSummary: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  reportSummaryItem: {
    flex: 0.47,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    padding: 12,
    alignItems: "center",
  },
  reportSummaryLabel: {
    fontSize: 11,
    color: "#999999",
    fontWeight: "600",
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  reportSummaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  reportSectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
    marginTop: 4,
  },
  reportEmptyText: {
    color: "#999999",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  reportCategoryItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  reportCategoryInfo: {
    flex: 1,
    marginRight: 12,
  },
  reportCategoryName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 6,
  },
  reportCategoryProgressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
    overflow: "hidden",
  },
  reportCategoryProgressFill: {
    height: "100%",
    backgroundColor: "#1A1A1A",
    borderRadius: 3,
  },
  reportCategoryAmount: {
    alignItems: "flex-end",
  },
  reportCategoryValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  reportCategoryPercent: {
    fontSize: 11,
    color: "#999999",
    fontWeight: "600",
    marginTop: 2,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: { flex: 1 },
});
