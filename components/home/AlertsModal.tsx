import { Button } from "@/components/ui/primary-button";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Modal, ScrollView, StyleSheet, Text, View } from "react-native";
import { formatINR } from "../../app/utils/constants";

type Props = {
  visible: boolean;
  onClose: () => void;
  exceededBudgets: string[];
  spendingByCategory: Record<string, number>;
  budgets: Record<string, number>;
  hideAmounts: boolean;
  onViewBudgets: () => void;
};

export function AlertsModal({
  visible,
  onClose,
  exceededBudgets,
  spendingByCategory,
  budgets,
  hideAmounts,
  onViewBudgets,
}: Props) {
  const displayAmount = (amount: number) =>
    hideAmounts ? "₹ ----" : formatINR(amount);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Budget Alerts</Text>
          <Text style={styles.alertsSubtitle}>
            {exceededBudgets.length} category budget exceeded
          </Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {exceededBudgets.map((category) => {
              const spent = spendingByCategory[category] || 0;
              const budgetLimit = budgets[category];
              const exceeded = spent - budgetLimit;
              const pct = (spent / budgetLimit) * 100;

              return (
                <View key={category} style={styles.alertCard}>
                  <View style={styles.alertHeader}>
                    <View style={styles.alertIconBg}>
                      <Ionicons
                        name="warning-outline"
                        size={20}
                        color="#FF6B6B"
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.alertCategory}>{category}</Text>
                      <Text style={styles.alertExceeded}>
                        Exceeded by {displayAmount(exceeded)}
                      </Text>
                    </View>
                    <Text style={styles.alertPercent}>{Math.round(pct)}%</Text>
                  </View>

                  <View style={styles.alertDetails}>
                    <View style={styles.alertDetailRow}>
                      <Text style={styles.alertDetailLabel}>Spent:</Text>
                      <Text style={styles.alertDetailValue}>
                        {displayAmount(spent)}
                      </Text>
                    </View>
                    <View style={styles.alertDetailRow}>
                      <Text style={styles.alertDetailLabel}>Budget:</Text>
                      <Text style={styles.alertDetailValue}>
                        {displayAmount(budgetLimit)}
                      </Text>
                    </View>
                    <View style={styles.alertDetailRow}>
                      <Text style={styles.alertDetailLabel}>Overage:</Text>
                      <Text style={styles.alertDetailValueRed}>
                        +{displayAmount(exceeded)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.alertProgressBar}>
                    <View
                      style={[
                        styles.alertProgressFill,
                        { width: `${Math.min(pct, 100)}%` },
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <View style={styles.modalButtons}>
            <Button
              text="View Budgets"
              onPress={onViewBudgets}
              style={styles.modalButton}
            />
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
    marginBottom: 8,
    textAlign: "center",
  },
  alertsSubtitle: {
    fontSize: 14,
    color: "#999999",
    fontWeight: "500",
    marginBottom: 16,
    textAlign: "center",
  },
  alertCard: {
    backgroundColor: "rgba(20, 184, 166, 0.08)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(20, 184, 166, 0.25)",
  },
  alertHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  alertIconBg: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "rgba(20, 184, 166, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertCategory: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  alertExceeded: {
    fontSize: 13,
    fontWeight: "600",
    color: "#555555",
  },
  alertPercent: {
    fontSize: 16,
    fontWeight: "700",
    color: "#14B8A6",
  },
  alertDetails: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  alertDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#E8E8E8",
  },
  alertDetailLabel: {
    fontSize: 12,
    color: "#999999",
    fontWeight: "500",
  },
  alertDetailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  alertDetailValueRed: {
    fontSize: 13,
    fontWeight: "700",
    color: "#555555",
  },
  alertProgressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  alertProgressFill: {
    height: "100%",
    backgroundColor: "#14B8A6",
    borderRadius: 4,
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: { flex: 1 },
});
