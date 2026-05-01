import { Button } from "@/components/ui/primary-button";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {
  addCustomCategory,
  CATEGORIES,
  formatINR,
  loadCategories,
} from "../../app/utils/constants";
import { SecondaryButton } from "../ui/secondary-button";

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (expense: {
    category: string;
    description: string;
    amount: number;
  }) => void;
  budgets: Record<string, number>;
  spendingByCategory: Record<string, number>;
};

export function ManualLogModal({
  visible,
  onClose,
  onSubmit,
  budgets,
  spendingByCategory,
}: Props) {
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [customCategoryInput, setCustomCategoryInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [categories, setCategories] = useState([...CATEGORIES]);

  // Load categories when modal opens
  useEffect(() => {
    if (visible) {
      loadCategories().then((loadedCategories) => {
        setCategories([...loadedCategories]);
      });
    }
  }, [visible]);

  const handleSubmit = () => {
    if (!description.trim() || !amount.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    // If "Other" is selected and user wants to add custom category
    if (category === "Other" && showCustomInput && customCategoryInput.trim()) {
      handleAddCustomCategory();
      return;
    }

    const parsed = parseFloat(amount);
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    const currentCategorySpend = spendingByCategory[category] || 0;
    const newCategorySpend = currentCategorySpend + parsed;
    const categoryBudget = budgets[category];
    const willExceed = newCategorySpend > categoryBudget;

    onSubmit({ category, description, amount: parsed });
    setDescription("");
    setAmount("");
    setCategory("Food");
    setCustomCategoryInput("");
    setShowCustomInput(false);
    onClose();

    if (willExceed) {
      Alert.alert(
        "⚠️ Budget Alert",
        `Expense of ${formatINR(parsed)} logged! \n\nYour ${category} budget (${formatINR(categoryBudget)}) will be exceeded by ${formatINR(newCategorySpend - categoryBudget)}`,
      );
    } else {
      Alert.alert(
        "Success",
        `Expense of ${formatINR(parsed)} logged successfully!`,
      );
    }
  };

  const handleAddCustomCategory = async () => {
    const trimmedName = customCategoryInput.trim();

    if (!trimmedName) {
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    const success = await addCustomCategory(trimmedName);

    if (success) {
      // Reload categories
      const loadedCategories = await loadCategories();
      setCategories([...loadedCategories]);
      setCategory(trimmedName);
      setShowCustomInput(false);
      setCustomCategoryInput("");

      Alert.alert(
        "Success",
        `Category "${trimmedName}" added! Now logging expense...`,
      );

      // Submit the expense with new category
      const parsed = parseFloat(amount);
      if (!isNaN(parsed) && parsed > 0) {
        onSubmit({ category: trimmedName, description, amount: parsed });
        setDescription("");
        setAmount("");
        setCategory("Food");
        onClose();

        Alert.alert(
          "Success",
          `Expense of ${formatINR(parsed)} logged to "${trimmedName}" successfully!`,
        );
      }
    } else {
      Alert.alert(
        "Error",
        `Could not add category "${trimmedName}". It may already exist.`,
      );
    }
  };

  const handleCancel = () => {
    setDescription("");
    setAmount("");
    setCategory("Food");
    setCustomCategoryInput("");
    setShowCustomInput(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleCancel}
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardAvoidingView}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Expense Manually</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₹)</Text>
                <View style={styles.amountInputWrapper}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={amount}
                    onChangeText={setAmount}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={styles.textInput}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="e.g., Lunch at cafe"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryGrid}>
                  {categories.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryBtn,
                        category === cat && styles.categoryBtnActive,
                      ]}
                      onPress={() => {
                        setCategory(cat);
                        if (cat === "Other") {
                          setShowCustomInput(true);
                        } else {
                          setShowCustomInput(false);
                          setCustomCategoryInput("");
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.categoryBtnText,
                          category === cat && styles.categoryBtnTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {showCustomInput && category === "Other" && (
                  <View style={styles.customCategoryContainer}>
                    <Text style={styles.customCategoryLabel}>
                      Add New Category
                    </Text>
                    <View style={styles.customCategoryInput}>
                      <TextInput
                        style={styles.customCategoryField}
                        value={customCategoryInput}
                        onChangeText={setCustomCategoryInput}
                        placeholder="e.g., Groceries, Fitness"
                        placeholderTextColor="#999"
                      />
                      <TouchableOpacity
                        style={styles.addCategoryBtn}
                        onPress={handleAddCustomCategory}
                      >
                        <Text style={styles.addCategoryBtnText}>+</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <SecondaryButton
                text="Cancel"
                onPress={handleCancel}
                style={styles.modalButton}
              />
              <SecondaryButton
                text={
                  showCustomInput && category === "Other"
                    ? "Add & Log"
                    : "Log Expense"
                }
                onPress={handleSubmit}
                style={styles.modalButton}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: "90%",
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: { marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 8,
  },
  amountInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
  },
  currencySymbol: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "600",
    paddingLeft: 12,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: "#1A1A1A",
    fontSize: 16,
  },
  textInput: {
    backgroundColor: "#FAFAFA",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#1A1A1A",
    fontSize: 14,
  },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  categoryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  categoryBtnActive: {
    backgroundColor: "#1A1A1A",
    borderColor: "#1A1A1A",
  },
  categoryBtnText: {
    color: "#666666",
    fontSize: 13,
    fontWeight: "500",
  },
  categoryBtnTextActive: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 24,
  },
  modalButton: { flex: 1 },
  customCategoryContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "rgba(26, 26, 26, 0.05)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(26, 26, 26, 0.1)",
  },
  customCategoryLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
    marginBottom: 8,
  },
  customCategoryInput: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  customCategoryField: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#1A1A1A",
    fontSize: 13,
  },
  addCategoryBtn: {
    width: 36,
    height: 36,
    backgroundColor: "#1A1A1A",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  addCategoryBtnText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
});
