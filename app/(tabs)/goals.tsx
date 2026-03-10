import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import {
    Alert,
    FlatList,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  timeHorizon: number; // in years
  currentLumpsum: number;
  monthlySIP: number;
  investmentOptions: InvestmentOption[];
  yearlyUpdates: YearlyUpdate[];
  createdAt: Date;
}

interface InvestmentOption {
  name: string;
  expectedReturn: number; // annual return percentage
  risk: "Low" | "Medium" | "High";
  monthlySIP?: number; // calculated SIP amount
}

interface YearlyUpdate {
  year: number;
  portfolioValue: number;
  lumpsumAdded: number;
  sipReduced: boolean;
  notes?: string;
}

// Investment options with expected returns
const INVESTMENT_OPTIONS: InvestmentOption[] = [
  { name: "Fixed Deposit", expectedReturn: 6.5, risk: "Low" },
  { name: "Balanced Advantage Fund", expectedReturn: 10, risk: "Medium" },
  { name: "Large Cap Mutual Fund", expectedReturn: 12, risk: "Medium" },
  { name: "Multi Asset Fund", expectedReturn: 11, risk: "Medium" },
  { name: "Equity Savings Fund", expectedReturn: 9, risk: "Low" },
  { name: "Aggressive Hybrid Fund", expectedReturn: 13, risk: "High" },
  { name: "Mid Cap Fund", expectedReturn: 14, risk: "High" },
  { name: "Small Cap Fund", expectedReturn: 16, risk: "High" },
];

export default function GoalsScreen() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Form states for creating goals
  const [goalName, setGoalName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [timeHorizon, setTimeHorizon] = useState("");
  const [currentLumpsum, setCurrentLumpsum] = useState("");

  // Form states for yearly updates
  const [portfolioValue, setPortfolioValue] = useState("");
  const [lumpsumAdded, setLumpsumAdded] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");
  const [reduceSIP, setReduceSIP] = useState(false);

  const formatINR = (amount: number) => {
    return "₹" + amount.toLocaleString("en-IN");
  };

  const calculateSIP = (
    targetAmount: number,
    timeHorizon: number,
    currentLumpsum: number,
    expectedReturn: number,
  ): number => {
    const monthlyRate = expectedReturn / 100 / 12;
    const months = timeHorizon * 12;

    // Future value of current lumpsum
    const fvLumpsum = currentLumpsum * Math.pow(1 + monthlyRate, months);

    // Required monthly SIP to reach target
    const requiredFV = targetAmount - fvLumpsum;

    if (requiredFV <= 0) return 0;

    const sip =
      (requiredFV * monthlyRate) / (Math.pow(1 + monthlyRate, months) - 1);
    return Math.ceil(sip);
  };

  const createGoal = () => {
    if (!goalName || !targetAmount || !timeHorizon) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    const target = parseFloat(targetAmount);
    const horizon = parseInt(timeHorizon);
    const lumpsum = parseFloat(currentLumpsum) || 0;

    if (target <= 0 || horizon <= 0) {
      Alert.alert("Error", "Please enter valid amounts and time horizon");
      return;
    }

    // Calculate SIP for each investment option
    const optionsWithSIP = INVESTMENT_OPTIONS.map((option) => ({
      ...option,
      monthlySIP: calculateSIP(target, horizon, lumpsum, option.expectedReturn),
    }));

    const newGoal: Goal = {
      id: Date.now().toString(),
      name: goalName,
      targetAmount: target,
      timeHorizon: horizon,
      currentLumpsum: lumpsum,
      monthlySIP: Math.min(...optionsWithSIP.map((opt) => opt.monthlySIP)),
      investmentOptions: optionsWithSIP,
      yearlyUpdates: [],
      createdAt: new Date(),
    };

    setGoals((prev) => [...prev, newGoal]);
    resetForm();
    setShowCreateModal(false);
  };

  const addYearlyUpdate = () => {
    if (!selectedGoal || !portfolioValue) {
      Alert.alert("Error", "Please enter portfolio value");
      return;
    }

    const value = parseFloat(portfolioValue);
    const lumpsum = parseFloat(lumpsumAdded) || 0;

    if (value < 0) {
      Alert.alert("Error", "Portfolio value cannot be negative");
      return;
    }

    const update: YearlyUpdate = {
      year: selectedGoal.yearlyUpdates.length + 1,
      portfolioValue: value,
      lumpsumAdded: lumpsum,
      sipReduced: reduceSIP,
      notes: updateNotes,
    };

    const updatedGoal = {
      ...selectedGoal,
      yearlyUpdates: [...selectedGoal.yearlyUpdates, update],
    };

    // Recalculate SIP if lumpsum was added or SIP was reduced
    if (lumpsum > 0 || reduceSIP) {
      const remainingAmount = selectedGoal.targetAmount - value;
      const remainingYears = selectedGoal.timeHorizon - update.year;

      if (remainingYears > 0 && remainingAmount > 0) {
        updatedGoal.investmentOptions = updatedGoal.investmentOptions.map(
          (option) => ({
            ...option,
            monthlySIP: calculateSIP(
              remainingAmount,
              remainingYears,
              lumpsum,
              option.expectedReturn,
            ),
          }),
        );
        updatedGoal.monthlySIP = Math.min(
          ...updatedGoal.investmentOptions
            .map((opt) => opt.monthlySIP || 0)
            .filter((sip) => sip > 0),
        );
      }
    }

    setGoals((prev) =>
      prev.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)),
    );
    setSelectedGoal(updatedGoal);
    resetUpdateForm();
    setShowUpdateModal(false);
  };

  const resetForm = () => {
    setGoalName("");
    setTargetAmount("");
    setTimeHorizon("");
    setCurrentLumpsum("");
  };

  const resetUpdateForm = () => {
    setPortfolioValue("");
    setLumpsumAdded("");
    setUpdateNotes("");
    setReduceSIP(false);
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "#00D09C";
      case "Medium":
        return "#FFB347";
      case "High":
        return "#FF6B6B";
      default:
        return "#FFFFFF";
    }
  };

  const renderGoalCard = ({ item }: { item: Goal }) => (
    <TouchableOpacity
      style={styles.goalCard}
      onPress={() => {
        setSelectedGoal(item);
        setShowUpdateModal(true);
      }}
    >
      <View style={styles.goalHeader}>
        <Text style={styles.goalName}>{item.name}</Text>
        <Text style={styles.goalTarget}>{formatINR(item.targetAmount)}</Text>
      </View>

      <View style={styles.goalDetails}>
        <Text style={styles.goalDetail}>Time: {item.timeHorizon} years</Text>
        <Text style={styles.goalDetail}>
          Monthly SIP: {formatINR(item.monthlySIP)}
        </Text>
        {item.currentLumpsum > 0 && (
          <Text style={styles.goalDetail}>
            Lumpsum: {formatINR(item.currentLumpsum)}
          </Text>
        )}
      </View>

      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>
          Progress: {item.yearlyUpdates.length}/{item.timeHorizon} years
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(item.yearlyUpdates.length / item.timeHorizon) * 100}%`,
              },
            ]}
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F16" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Text style={styles.addButtonText}>+ Add Goal</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={goals}
        renderItem={renderGoalCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.goalsList}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No goals yet</Text>
            <Text style={styles.emptySubtext}>
              Create your first financial goal to get started
            </Text>
          </View>
        }
      />

      {/* Create Goal Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Goal</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Goal Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={goalName}
                  onChangeText={setGoalName}
                  placeholder="e.g., Buy a Car"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={targetAmount}
                  onChangeText={setTargetAmount}
                  placeholder="1000000"
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Time Horizon (Years) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={timeHorizon}
                  onChangeText={setTimeHorizon}
                  placeholder="5"
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Current Lumpsum (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  value={currentLumpsum}
                  onChangeText={setCurrentLumpsum}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                text="Cancel"
                onPress={() => {
                  resetForm();
                  setShowCreateModal(false);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                text="Create Goal"
                onPress={createGoal}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Goal Modal */}
      <Modal
        visible={showUpdateModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUpdateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Update {selectedGoal?.name} - Year{" "}
              {(selectedGoal?.yearlyUpdates?.length || 0) + 1}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Current Portfolio Value (₹) *
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={portfolioValue}
                  onChangeText={setPortfolioValue}
                  placeholder="500000"
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Lumpsum Added This Year (₹)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={lumpsumAdded}
                  onChangeText={setLumpsumAdded}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.checkboxGroup}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setReduceSIP(!reduceSIP)}
                >
                  <View
                    style={[
                      styles.checkboxBox,
                      reduceSIP && styles.checkboxChecked,
                    ]}
                  >
                    {reduceSIP && <Text style={styles.checkmark}>✓</Text>}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Reduce monthly SIP amount
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={updateNotes}
                  onChangeText={setUpdateNotes}
                  placeholder="Any additional notes..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#666"
                />
              </View>

              {selectedGoal && (
                <View style={styles.investmentOptions}>
                  <Text style={styles.optionsTitle}>Investment Options</Text>
                  {selectedGoal.investmentOptions.map((option, index) => (
                    <View key={index} style={styles.optionCard}>
                      <View style={styles.optionHeader}>
                        <Text style={styles.optionName}>{option.name}</Text>
                        <View
                          style={[
                            styles.riskBadge,
                            {
                              backgroundColor: getRiskColor(option.risk) + "20",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.riskText,
                              { color: getRiskColor(option.risk) },
                            ]}
                          >
                            {option.risk} Risk
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.optionReturn}>
                        Expected Return: {option.expectedReturn}% p.a.
                      </Text>
                      <Text style={styles.optionSIP}>
                        Monthly SIP: {formatINR(option.monthlySIP || 0)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                text="Cancel"
                onPress={() => {
                  resetUpdateForm();
                  setShowUpdateModal(false);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                text="Update"
                onPress={addYearlyUpdate}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F0F16",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  addButton: {
    backgroundColor: "#00D09C",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#0F0F16",
    fontWeight: "600",
  },
  goalsList: {
    padding: 20,
  },
  goalCard: {
    backgroundColor: "#1A1A26",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#2A2A38",
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  goalName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  goalTarget: {
    fontSize: 16,
    fontWeight: "600",
    color: "#00D09C",
  },
  goalDetails: {
    marginBottom: 12,
  },
  goalDetail: {
    fontSize: 14,
    color: "#CCCCCC",
    marginBottom: 4,
  },
  progressContainer: {
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#2A2A38",
    borderRadius: 2,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00D09C",
    borderRadius: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: "#888888",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666666",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1A1A26",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: "#FFFFFF",
    marginBottom: 8,
    fontWeight: "500",
  },
  textInput: {
    backgroundColor: "#2A2A38",
    borderRadius: 8,
    padding: 12,
    color: "#FFFFFF",
    fontSize: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  checkboxGroup: {
    marginBottom: 16,
  },
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: "#00D09C",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#00D09C",
  },
  checkmark: {
    color: "#0F0F16",
    fontSize: 12,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#FFFFFF",
  },
  investmentOptions: {
    marginTop: 20,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: "#2A2A38",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  optionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  optionName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  riskBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 12,
    fontWeight: "500",
  },
  optionReturn: {
    fontSize: 14,
    color: "#CCCCCC",
    marginBottom: 4,
  },
  optionSIP: {
    fontSize: 14,
    color: "#00D09C",
    fontWeight: "600",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    marginHorizontal: 4,
  },
});
