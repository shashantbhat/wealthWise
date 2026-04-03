import {
  adjustGoalProgress,
  calculateFutureValue,
  calculateRequiredSIP,
} from "@/app/utils/goalCalculator";
import { Button } from "@/components/ui/primary-button";
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
  currentCorpus: number; // initial investment
  monthlySIP: number;
  expectedReturn: number; // expected annual return
  investmentOptions: InvestmentOption[];
  history: HistoryEntry[];
  createdAt: Date;
}

interface InvestmentOption {
  name: string;
  expectedReturn: number; // annual return percentage
  risk: "Low" | "Medium" | "High";
  monthlySIP?: number; // calculated SIP amount
}

interface HistoryEntry {
  year: number;
  portfolioValue: number;
  extraAdded: number;
  actualReturn: number; // actual annual return
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
  const [initialCorpus, setInitialCorpus] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("12");

  // Form states for yearly updates
  const [portfolioValue, setPortfolioValue] = useState("");
  const [extraAdded, setExtraAdded] = useState("");
  const [actualReturn, setActualReturn] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");

  const formatINR = (amount: number) => {
    return "₹" + amount.toLocaleString("en-IN");
  };

  const createGoal = () => {
    if (!goalName || !targetAmount || !timeHorizon) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    const target = parseFloat(targetAmount);
    const horizon = parseInt(timeHorizon);
    const corpus = parseFloat(initialCorpus) || 0;
    const expectedReturnRate = parseFloat(expectedReturn) || 12;

    if (target <= 0 || horizon <= 0) {
      Alert.alert("Error", "Please enter valid amounts and time horizon");
      return;
    }

    // Calculate SIP for each investment option using the new formula
    const optionsWithSIP = INVESTMENT_OPTIONS.map((option) => ({
      ...option,
      monthlySIP: calculateRequiredSIP({
        targetAmount: target,
        years: horizon,
        expectedReturn: option.expectedReturn,
        initialLumpSum: corpus,
      }),
    }));

    const newGoal: Goal = {
      id: Date.now().toString(),
      name: goalName,
      targetAmount: target,
      timeHorizon: horizon,
      currentCorpus: corpus,
      expectedReturn: expectedReturnRate,
      monthlySIP: Math.min(...optionsWithSIP.map((opt) => opt.monthlySIP || 0)),
      investmentOptions: optionsWithSIP,
      history: [],
      createdAt: new Date(),
    };

    setGoals((prev) => [...prev, newGoal]);
    resetForm();
    setShowCreateModal(false);
  };

  const addYearlyUpdate = () => {
    if (!selectedGoal || !portfolioValue || !actualReturn) {
      Alert.alert("Error", "Please enter portfolio value and actual return");
      return;
    }

    const portfolio = parseFloat(portfolioValue);
    const extra = parseFloat(extraAdded) || 0;
    const actualReturnRate = parseFloat(actualReturn);

    if (portfolio < 0) {
      Alert.alert("Error", "Portfolio value cannot be negative");
      return;
    }

    if (actualReturnRate < -100) {
      Alert.alert("Error", "Return cannot be less than -100%");
      return;
    }

    const year = selectedGoal.history.length + 1;
    const remainingYears = selectedGoal.timeHorizon - year;

    // Create history entry
    const historyEntry: HistoryEntry = {
      year,
      portfolioValue: portfolio,
      extraAdded: extra,
      actualReturn: actualReturnRate,
      notes: updateNotes,
    };

    let updatedGoal = {
      ...selectedGoal,
      history: [...selectedGoal.history, historyEntry],
    };

    // Recalculate SIP for remaining years using adjustGoalProgress
    if (remainingYears > 0 && portfolio > 0) {
      const adjustment = adjustGoalProgress({
        currentCorpus: portfolio,
        extraSavings: extra,
        actualYearlyReturn: actualReturnRate,
        remainingYears,
        finalTarget: selectedGoal.targetAmount,
      });

      // Update investment options with new SIP amounts
      updatedGoal.investmentOptions = updatedGoal.investmentOptions.map(
        (option) => ({
          ...option,
          monthlySIP: calculateRequiredSIP({
            targetAmount: selectedGoal.targetAmount,
            years: remainingYears,
            expectedReturn: option.expectedReturn,
            initialLumpSum: adjustment.updatedCorpus,
          }),
        }),
      );

      updatedGoal.monthlySIP = Math.min(
        ...updatedGoal.investmentOptions
          .map((opt) => opt.monthlySIP || 0)
          .filter((sip) => sip > 0),
      );
      updatedGoal.currentCorpus = adjustment.updatedCorpus;
    }

    setGoals((prev) =>
      prev.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)),
    );
    setSelectedGoal(updatedGoal);
    resetUpdateForm();
    setShowUpdateModal(false);

    Alert.alert(
      "Success",
      `Year ${year} update recorded. ${
        remainingYears > 0
          ? `New monthly SIP: ${formatINR(updatedGoal.monthlySIP)}`
          : ""
      }`,
    );
  };

  const resetForm = () => {
    setGoalName("");
    setTargetAmount("");
    setTimeHorizon("");
    setInitialCorpus("");
    setExpectedReturn("12");
  };

  const resetUpdateForm = () => {
    setPortfolioValue("");
    setExtraAdded("");
    setActualReturn("");
    setUpdateNotes("");
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low":
        return "#10605A";
      case "Medium":
        return "#5CCAD4";
      case "High":
        return "#FF6B6B";
      default:
        return "#FFFFFF";
    }
  };

  const getPerformanceStatus = (
    goal: Goal,
  ): { label: string; color: string } => {
    if (goal.history.length === 0)
      return { label: "On Track", color: "#10605A" };
    const latest = goal.history[goal.history.length - 1];
    const diff = latest.actualReturn - goal.expectedReturn;
    if (diff > 0.5) return { label: "Outperforming", color: "#00C853" };
    if (diff < -0.5) return { label: "Underperforming", color: "#FF6B6B" };
    return { label: "On Track", color: "#10605A" };
  };

  const renderGoalCard = ({ item }: { item: Goal }) => {
    // Calculate progress percentage based on current corpus vs target
    const progressPercentage = (item.currentCorpus / item.targetAmount) * 100;

    // Project final value based on current SIP and expected return
    const monthsRemaining = (item.timeHorizon - item.history.length) * 12;
    const projectedValue =
      monthsRemaining > 0
        ? calculateFutureValue(
            item.monthlySIP,
            monthsRemaining,
            item.expectedReturn,
            item.currentCorpus,
          )
        : item.currentCorpus;

    const performance = getPerformanceStatus(item);

    return (
      <TouchableOpacity
        style={styles.goalCard}
        onPress={() => {
          setSelectedGoal(item);
          setShowUpdateModal(true);
        }}
      >
        <View style={styles.goalHeader}>
          <Text style={styles.goalName}>{item.name}</Text>
          <View style={{ alignItems: "flex-end", gap: 4 }}>
            <Text style={styles.goalTarget}>
              {formatINR(item.targetAmount)}
            </Text>
            <View
              style={[
                styles.performanceBadge,
                {
                  backgroundColor: performance.color + "22",
                  borderColor: performance.color + "66",
                },
              ]}
            >
              <View
                style={[
                  styles.performanceDot,
                  { backgroundColor: performance.color },
                ]}
              />
              <Text
                style={[
                  styles.performanceBadgeText,
                  { color: performance.color },
                ]}
              >
                {performance.label}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.goalDetails}>
          <Text style={styles.goalDetail}>Time: {item.timeHorizon} years</Text>
          <Text style={styles.goalDetail}>
            Monthly SIP: {formatINR(item.monthlySIP)}
          </Text>
          <Text style={styles.goalDetail}>
            Current Corpus: {formatINR(item.currentCorpus)}
          </Text>
          <Text style={styles.goalDetail}>
            Expected Return: {item.expectedReturn}% p.a.
          </Text>
          {projectedValue >= item.targetAmount && (
            <Text style={[styles.goalDetail, { color: "#10605A" }]}>
              ✓ On Track
            </Text>
          )}
        </View>

        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            Progress: {item.history.length}/{item.timeHorizon} years
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(progressPercentage, 100)}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressValue}>
            {formatINR(item.currentCorpus)} / {formatINR(item.targetAmount)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

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
                  placeholder="1500000"
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
                <Text style={styles.inputLabel}>Initial Lump Sum (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  value={initialCorpus}
                  onChangeText={setInitialCorpus}
                  placeholder="50000"
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Expected Annual Return (%)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={expectedReturn}
                  onChangeText={setExpectedReturn}
                  placeholder="12"
                  keyboardType="decimal-pad"
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
              Yearly Review - {selectedGoal?.name}
            </Text>
            <Text style={styles.modalSubtitle}>
              Year {(selectedGoal?.history?.length || 0) + 1} of{" "}
              {selectedGoal?.timeHorizon}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Current Status</Text>
                {selectedGoal && (
                  <View style={styles.reviewCard}>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Portfolio Value:</Text>
                      <Text style={styles.reviewValue}>
                        {formatINR(selectedGoal.currentCorpus)}
                      </Text>
                    </View>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Monthly SIP:</Text>
                      <Text style={styles.reviewValue}>
                        {formatINR(selectedGoal.monthlySIP)}
                      </Text>
                    </View>
                    <View style={styles.reviewRow}>
                      <Text style={styles.reviewLabel}>Target:</Text>
                      <Text style={styles.reviewValue}>
                        {formatINR(selectedGoal.targetAmount)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>

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
                  Extra Savings This Year (₹)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={extraAdded}
                  onChangeText={setExtraAdded}
                  placeholder="0"
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>
                  Actual Return This Year (%) *
                </Text>
                <Text style={styles.inputHelper}>
                  Enter the actual annual return achieved
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={actualReturn}
                  onChangeText={setActualReturn}
                  placeholder="10.5"
                  keyboardType="decimal-pad"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Notes</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={updateNotes}
                  onChangeText={setUpdateNotes}
                  placeholder="Market performance, inflation impact, etc."
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
    backgroundColor: "#FFFFFF",
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
    color: "#1A1A1A",
  },
  addButton: {
    backgroundColor: "#10605A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  goalsList: {
    padding: 20,
  },
  goalCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
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
    color: "#1A1A1A",
  },
  goalTarget: {
    fontSize: 16,
    fontWeight: "600",
    color: "#10605A",
  },
  performanceBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  performanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  performanceBadgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  goalDetails: {
    marginBottom: 12,
  },
  goalDetail: {
    fontSize: 14,
    color: "#666666",
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
  progressValue: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E0E0E0",
    borderRadius: 3,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#10605A",
    borderRadius: 3,
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
    color: "#AAAAAA",
    textAlign: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxHeight: "90%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1A1A1A",
    marginBottom: 4,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 20,
    textAlign: "center",
  },
  reviewSection: {
    marginBottom: 20,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  reviewCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
  },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  reviewLabel: {
    fontSize: 14,
    color: "#666666",
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#10605A",
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    color: "#1A1A1A",
    marginBottom: 8,
    fontWeight: "500",
  },
  inputHelper: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    color: "#1A1A1A",
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#E0E0E0",
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
    borderColor: "#10605A",
    borderRadius: 4,
    marginRight: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#10605A",
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#1A1A1A",
  },
  investmentOptions: {
    marginTop: 20,
  },
  optionsTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
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
    color: "#1A1A1A",
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
    color: "#666666",
    marginBottom: 4,
  },
  optionSIP: {
    fontSize: 14,
    color: "#10605A",
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
