import { Button } from "@/components/ui/primary-button";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  CATEGORIES,
  formatINR,
  loadCategories,
} from "../../app/utils/constants";

type Props = {
  visible: boolean;
  onClose: () => void;
  budgets: Record<string, number>;
  spendingByCategory: Record<string, number>;
  onUpdateBudget: (category: string, amount: number) => void;
  hideAmounts: boolean;
};

export function BudgetModal({
  visible,
  onClose,
  budgets,
  spendingByCategory,
  onUpdateBudget,
  hideAmounts,
}: Props) {
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>(
    Object.fromEntries(Object.entries(budgets).map(([k, v]) => [k, String(v)])),
  );
  const [categories, setCategories] = useState([...CATEGORIES]);

  // Sync inputs and load categories when modal opens
  useEffect(() => {
    if (visible) {
      setBudgetInputs(
        Object.fromEntries(
          Object.entries(budgets).map(([k, v]) => [k, String(v)]),
        ),
      );
      // Load custom categories
      loadCategories().then((loadedCategories) => {
        setCategories([...loadedCategories]);
      });
    }
  }, [visible, budgets]);

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
          <Text style={styles.modalTitle}>Set Category Budgets</Text>

          <ScrollView showsVerticalScrollIndicator={false}>
            {categories.map((category) => {
              const spent = spendingByCategory[category] || 0;
              const budgetLimit = budgets[category] || 0;
              const isExceeded = spent > budgetLimit && budgetLimit > 0;
              const pct = budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;

              return (
                <View key={category} style={styles.budgetItem}>
                  <View style={styles.budgetHeader}>
                    <View>
                      <Text style={styles.budgetCategory}>{category}</Text>
                      <Text
                        style={[
                          styles.budgetSpent,
                          isExceeded && styles.budgetSpentExceeded,
                        ]}
                      >
                        {displayAmount(spent)} / {displayAmount(budgetLimit)}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.budgetPercent,
                        isExceeded && styles.budgetPercentExceeded,
                      ]}
                    >
                      {Math.round(pct)}%
                    </Text>
                  </View>

                  <View style={styles.budgetProgressBar}>
                    <View
                      style={[
                        styles.budgetProgressFill,
                        {
                          width: `${Math.min(pct, 100)}%`,
                          backgroundColor: isExceeded ? "#555555" : "#1A1A1A",
                        },
                      ]}
                    />
                  </View>

                  <View style={styles.budgetInputGroup}>
                    <TextInput
                      style={styles.budgetInput}
                      value={budgetInputs[category]}
                      onChangeText={(value) =>
                        setBudgetInputs((prev) => ({
                          ...prev,
                          [category]: value,
                        }))
                      }
                      placeholder="0"
                      keyboardType="decimal-pad"
                      placeholderTextColor="#999"
                    />
                    <TouchableOpacity
                      style={styles.budgetUpdateBtn}
                      onPress={() => {
                        const newAmount = parseFloat(budgetInputs[category]);
                        if (!isNaN(newAmount) && newAmount > 0) {
                          onUpdateBudget(category, newAmount);
                          Alert.alert(
                            "Success",
                            `Budget for ${category} updated!`,
                          );
                        } else {
                          Alert.alert("Error", "Please enter a valid amount");
                        }
                      }}
                    >
                      <Text style={styles.budgetUpdateBtnText}>Update</Text>
                    </TouchableOpacity>
                  </View>

                  {isExceeded && (
                    <View style={styles.budgetAlert}>
                      <Text style={styles.budgetAlertText}>
                        ⚠️ Budget exceeded by{" "}
                        {displayAmount(spent - budgetLimit)}
                      </Text>
                    </View>
                  )}
                </View>
              );
            })}
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
  budgetItem: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  budgetCategory: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  budgetSpent: { fontSize: 13, color: "#666666" },
  budgetSpentExceeded: { color: "#555555", fontWeight: "600" },
  budgetPercent: { fontSize: 18, fontWeight: "700", color: "#1A1A1A" },
  budgetPercentExceeded: { color: "#555555" },
  budgetProgressBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  budgetProgressFill: {
    height: "100%",
    borderRadius: 4,
  },
  budgetInputGroup: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  budgetInput: {
    flex: 1,
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: "#1A1A1A",
    fontSize: 14,
  },
  budgetUpdateBtn: {
    backgroundColor: "#1A1A1A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    justifyContent: "center",
  },
  budgetUpdateBtnText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 12,
  },
  budgetAlert: {
    backgroundColor: "#F0F0F0",
    borderRadius: 8,
    padding: 10,
    borderLeftWidth: 4,
    borderLeftColor: "#555555",
  },
  budgetAlertText: {
    color: "#555555",
    fontSize: 12,
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: { flex: 1 },
});
