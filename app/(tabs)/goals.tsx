import {
    Goal,
    HistoryEntry,
    InvestmentOption,
    loadGoals,
    saveGoals,
    loadBudgets,
} from "@/app/utils/budgetsGoalsStorage";
import {
    adjustGoalProgress,
    calculateFutureValue,
    calculateRequiredSIP,
} from "@/app/utils/goalCalculator";
import { getCurrentMonthExpenses } from "@/app/utils/expenseStorageOptimized";
import { Button } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { useEffect, useState } from "react";
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
import Slider from "@react-native-community/slider";

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
  const [riskProfile, setRiskProfile] = useState<"Low" | "Medium" | "High">("Medium");
  const [showRiskDropdown, setShowRiskDropdown] = useState(false);

  // Form states for yearly updates
  const [portfolioValue, setPortfolioValue] = useState("");
  const [extraAdded, setExtraAdded] = useState("");
  const [actualReturn, setActualReturn] = useState("");
  const [updateNotes, setUpdateNotes] = useState("");

  // Form states for top-up
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");

  // State for goal deletion
  const [selectedForDelete, setSelectedForDelete] = useState<string | null>(null);

  // Goal Coach data
  const [monthlyExpenses, setMonthlyExpenses] = useState<Record<string, number>>({});
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [sliderCutAmount, setSliderCutAmount] = useState(0);

  // Load goals on mount
  useEffect(() => {
    loadGoals()
      .then(setGoals)
      .catch((error) => console.error("Failed to load goals:", error));

    // Load expenses and budgets for Goal Coach
    Promise.all([getCurrentMonthExpenses(), loadBudgets()])
      .then(([expenseData, budgetData]) => {
        if (expenseData?.categoryBreakdown) {
          setMonthlyExpenses(expenseData.categoryBreakdown);
        }
        if (budgetData) {
          setBudgets(budgetData);
        }
      })
      .catch((error) => console.error("Failed to load expense/budget data:", error));
  }, []);

  // Save goals whenever they change
  useEffect(() => {
    if (goals.length > 0) {
      saveGoals(goals).catch((error) =>
        console.error("Failed to save goals:", error),
      );
    }
  }, [goals]);

  const formatINR = (amount: number) => {
    return "₹" + amount.toLocaleString("en-IN");
  };

  const getInvestmentOptionsByRisk = (risk: "Low" | "Medium" | "High") => {
    return INVESTMENT_OPTIONS.filter((opt) => opt.risk === risk);
  };

  const getExpectedReturnForRisk = (risk: "Low" | "Medium" | "High") => {
    const options = getInvestmentOptionsByRisk(risk);
    if (options.length === 0) return 10;
    // Return average expected return of options in this risk category
    const avgReturn = options.reduce((sum, opt) => sum + opt.expectedReturn, 0) / options.length;
    return Math.round(avgReturn * 10) / 10;
  };

  const createGoal = () => {
    if (!goalName || !targetAmount || !timeHorizon) {
      Alert.alert("Error", "Please fill all required fields");
      return;
    }

    const target = parseFloat(targetAmount);
    const horizon = parseInt(timeHorizon);
    const corpus = parseFloat(initialCorpus) || 0;
    const expectedReturnRate = getExpectedReturnForRisk(riskProfile);

    if (target <= 0 || horizon <= 0) {
      Alert.alert("Error", "Please enter valid amounts and time horizon");
      return;
    }

    // Get investment options for selected risk profile
    const riskProfileOptions = getInvestmentOptionsByRisk(riskProfile);
    
    // Calculate SIP for each investment option using the new formula
    const optionsWithSIP = riskProfileOptions.map((option) => ({
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
      createdAt: new Date().toISOString(),
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
    setRiskProfile("Medium");
    setShowRiskDropdown(false);
  };

  const resetUpdateForm = () => {
    setPortfolioValue("");
    setExtraAdded("");
    setActualReturn("");
    setUpdateNotes("");
  };

  const addTopUp = () => {
    if (!selectedGoal || !topUpAmount) {
      Alert.alert("Error", "Please enter a top-up amount");
      return;
    }

    const topUp = parseFloat(topUpAmount);

    if (topUp <= 0) {
      Alert.alert("Error", "Top-up amount must be greater than 0");
      return;
    }

    const updatedGoal = {
      ...selectedGoal,
      currentCorpus: selectedGoal.currentCorpus + topUp,
    };

    setGoals((prev) =>
      prev.map((g) => (g.id === selectedGoal.id ? updatedGoal : g)),
    );
    setSelectedGoal(updatedGoal);
    setTopUpAmount("");
    setShowTopUpModal(false);

    Alert.alert(
      "Success",
      `Top-up of ${formatINR(topUp)} added. New corpus: ${formatINR(updatedGoal.currentCorpus)}`,
    );
  };

  const deleteGoal = (goalId: string) => {
    Alert.alert(
      "Delete Goal",
      "Are you sure you want to delete this goal? This action cannot be undone.",
      [
        {
          text: "Cancel",
          onPress: () => setSelectedForDelete(null),
        },
        {
          text: "Delete",
          onPress: () => {
            setGoals((prev) => prev.filter((g) => g.id !== goalId));
            setSelectedForDelete(null);
            Alert.alert("Success", "Goal deleted successfully");
          },
          style: "destructive",
        },
      ],
    );
  };

  // Goal Coach Helper Functions
  const calculateGoalHealthScore = (): number => {
    if (goals.length === 0) return 100;

    // Total monthly SIP required across all goals
    const totalRequiredSIP = goals.reduce((sum, goal) => sum + goal.monthlySIP, 0);

    // Total actual monthly savings = (Income - Total Expenses)
    // For simplicity, we estimate from expenses (user should set income elsewhere)
    const totalExpenses = Object.values(monthlyExpenses).reduce((sum, exp) => sum + exp, 0);
    
    // Assume income of ~3x average expenses for estimation (can be improved with user income data)
    const estimatedIncome = totalExpenses > 0 ? totalExpenses * 3 : 50000;
    const actualSavings = Math.max(0, estimatedIncome - totalExpenses);

    // Health score: what % of required SIP is covered by actual savings
    const healthScore = totalRequiredSIP > 0 ? (actualSavings / totalRequiredSIP) * 100 : 100;
    return Math.min(100, Math.round(healthScore));
  };

  const calculateWhatIfSavings = (cutAmount: number): number => {
    if (goals.length === 0) return 0;
    const totalMonthlyGoalSIP = goals.reduce((sum, g) => sum + g.monthlySIP, 0);
    const monthsEarlier = totalMonthlyGoalSIP > 0 ? (cutAmount / totalMonthlyGoalSIP) * 12 : 0;
    return Math.round(monthsEarlier * 10) / 10;
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
        style={[
          styles.goalCard,
          selectedForDelete === item.id && styles.goalCardSelected,
        ]}
        onPress={() => {
          if (selectedForDelete === item.id) {
            setSelectedForDelete(null);
          } else {
            setSelectedGoal(item);
            setShowUpdateModal(true);
          }
        }}
        onLongPress={() => {
          setSelectedForDelete(item.id);
        }}
        delayLongPress={500}
      >
        <View style={styles.goalHeader}>
          <View style={styles.goalHeaderLeft}>
            {selectedForDelete === item.id && (
              <View style={styles.deleteCheckbox}>
                <Text style={styles.deleteCheckmark}>✓</Text>
              </View>
            )}
            <Text style={styles.goalName}>{item.name}</Text>
          </View>
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

        <View style={styles.goalCardActions}>
          {selectedForDelete === item.id ? (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => deleteGoal(item.id)}
            >
              <Text style={styles.deleteButtonText}>🗑️ Delete</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.topUpButton}
              onPress={() => {
                setSelectedGoal(item);
                setShowTopUpModal(true);
              }}
            >
              <Text style={styles.topUpButtonText}>+ Top Up</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Financial Goals</Text>
        <SecondaryButton
          text="Add Goal"
          onPress={() => setShowCreateModal(true)}
        />
      </View>

      <FlatList
        data={goals}
        renderItem={renderGoalCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.goalsList}
        ListFooterComponent={
          goals.length > 0 && (
            <View style={styles.goalCoachSection}>
              {/* 1. Goal Health Score */}
              <View style={styles.healthScoreCard}>
                <Text style={styles.coachTitle}>🎯 Goal Health Score</Text>
                <View style={styles.scoreContainer}>
                  <Text style={styles.scoreValue}>{calculateGoalHealthScore()}%</Text>
                  <Text style={styles.scoreLabel}>of monthly SIP covered</Text>
                </View>
                <View style={styles.scoreBar}>
                  <View
                    style={[
                      styles.scoreBarFill,
                      {
                        width: `${Math.min(calculateGoalHealthScore(), 100)}%`,
                        backgroundColor:
                          calculateGoalHealthScore() >= 80
                            ? "#10605A"
                            : calculateGoalHealthScore() >= 50
                              ? "#5CCAD4"
                              : "#FF6B6B",
                      },
                    ]}
                  />
                </View>
              </View>

              {/* 2. What-If Simulator */}
              <View style={styles.simulatorCard}>
                <Text style={styles.coachTitle}>📊 What-If Savings Booster</Text>
                <View style={styles.sliderContainer}>
                  <Text style={styles.sliderLabel}>Cut spending by:</Text>
                  <Text style={styles.sliderAmount}>{formatINR(sliderCutAmount)}</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={Math.max(
                      5000,
                      Object.values(monthlyExpenses).reduce((a, b) => a + b, 0) * 0.2
                    )}
                    onValueChange={setSliderCutAmount}
                    step={100}
                  />
                </View>
                <View style={styles.simulatorResult}>
                  <Text style={styles.resultLabel}>Reach your goal:</Text>
                  <Text style={styles.resultValue}>
                    {calculateWhatIfSavings(sliderCutAmount)} months earlier
                  </Text>
                </View>
              </View>

              <View style={styles.coachDivider} />
            </View>
          )
        }
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
                  placeholderTextColor="#BBBBBB"
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
                  placeholderTextColor="#BBBBBB"
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
                  placeholderTextColor="#BBBBBB"
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
                  placeholderTextColor="#BBBBBB"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Risk Profile *</Text>
                <TouchableOpacity
                  style={[styles.textInput, styles.riskProfileButton]}
                  onPress={() => setShowRiskDropdown(!showRiskDropdown)}
                >
                  <Text style={styles.riskProfileText}>{riskProfile}</Text>
                  <Text style={styles.dropdownArrow}>{showRiskDropdown ? "▲" : "▼"}</Text>
                </TouchableOpacity>
                {showRiskDropdown && (
                  <View style={styles.riskDropdown}>
                    {["Low", "Medium", "High"].map((risk) => (
                      <TouchableOpacity
                        key={risk}
                        style={[
                          styles.riskOption,
                          riskProfile === risk && styles.riskOptionSelected,
                        ]}
                        onPress={() => {
                          setRiskProfile(risk as "Low" | "Medium" | "High");
                          setShowRiskDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.riskOptionText,
                            riskProfile === risk && styles.riskOptionTextSelected,
                          ]}
                        >
                          {risk}
                        </Text>
                        <Text style={styles.riskOptionReturn}>
                          (~{getExpectedReturnForRisk(risk as "Low" | "Medium" | "High")}%)
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Investment Options Preview */}
              {riskProfile && (
                <View style={styles.investmentOptions}>
                  <Text style={styles.optionsTitle}>
                    Available Investments ({riskProfile} Risk)
                  </Text>
                  {getInvestmentOptionsByRisk(riskProfile).map((option, index) => (
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
                    </View>
                  ))}
                </View>
              )}
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
                  placeholderTextColor="#BBBBBB"
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
                  placeholderTextColor="#BBBBBB"
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
                  placeholderTextColor="#BBBBBB"
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
                  placeholderTextColor="#BBBBBB"
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

      {/* Top Up Modal */}
      <Modal
        visible={showTopUpModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTopUpModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              Top Up Investment - {selectedGoal?.name}
            </Text>
            <Text style={styles.modalSubtitle}>
              Current Corpus: {selectedGoal && formatINR(selectedGoal.currentCorpus)}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Top-Up Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  value={topUpAmount}
                  onChangeText={setTopUpAmount}
                  placeholder="50000"
                  keyboardType="numeric"
                  placeholderTextColor="#666"
                  autoFocus
                />
              </View>

              <View style={styles.topUpPreview}>
                <Text style={styles.previewLabel}>New Corpus:</Text>
                <Text style={styles.previewAmount}>
                  {selectedGoal && topUpAmount
                    ? formatINR(
                        selectedGoal.currentCorpus + parseFloat(topUpAmount)
                      )
                    : selectedGoal && formatINR(selectedGoal.currentCorpus)}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                text="Cancel"
                onPress={() => {
                  setTopUpAmount("");
                  setShowTopUpModal(false);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                text="Add Top Up"
                onPress={addTopUp}
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
  goalCardSelected: {
    backgroundColor: "#FF6B6B15",
    borderColor: "#FF6B6B",
    borderWidth: 2,
  },
  goalCardActions: {
    marginTop: 12,
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  topUpButton: {
    backgroundColor: "#10605A",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  topUpButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: "#FF6B6B",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  deleteButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 14,
  },
  goalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  goalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  deleteCheckbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteCheckmark: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
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
    color: "#BBBBBBBBBBBB",
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
    color: "#BBBBBBBBBBBB",
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
    color: "#BBBBBBBBBBBB",
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
    color: "#BBBBBBBBBBBB",
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
    color: "#BBBBBBBBBBBB",
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
  riskProfileButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  riskProfileText: {
    fontSize: 16,
    color: "#1A1A1A",
    fontWeight: "500",
  },
  dropdownArrow: {
    fontSize: 12,
    color: "#888888",
  },
  riskDropdown: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    marginTop: -8,
    marginBottom: 8,
    overflow: "hidden",
  },
  riskOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  riskOptionSelected: {
    backgroundColor: "#10605A20",
  },
  riskOptionText: {
    fontSize: 14,
    color: "#666666",
  },
  riskOptionTextSelected: {
    color: "#10605A",
    fontWeight: "600",
  },
  riskOptionReturn: {
    fontSize: 12,
    color: "#888888",
  },
  topUpPreview: {
    backgroundColor: "#10605A15",
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: "#10605A40",
  },
  previewLabel: {
    fontSize: 14,
    color: "#666666",
    marginBottom: 6,
  },
  previewAmount: {
    fontSize: 24,
    fontWeight: "700",
    color: "#10605A",
  },
  goalCoachSection: {
    marginBottom: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  healthScoreCard: {
    backgroundColor: "#10605A08",
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#10605A30",
  },
  coachTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  scoreContainer: {
    alignItems: "center",
    marginBottom: 12,
  },
  scoreValue: {
    fontSize: 42,
    fontWeight: "800",
    color: "#10605A",
  },
  scoreLabel: {
    fontSize: 12,
    color: "#666666",
    marginTop: 4,
  },
  scoreBar: {
    height: 8,
    backgroundColor: "#E0E0E0",
    borderRadius: 4,
    overflow: "hidden",
  },
  scoreBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  impactSection: {
    marginBottom: 16,
  },
  impactCard: {
    backgroundColor: "#FF6B6B10",
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#FF6B6B",
  },
  impactRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  impactCategory: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  impactAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FF6B6B",
  },
  impactSubtext: {
    fontSize: 12,
    color: "#666666",
    fontStyle: "italic",
  },
  simulatorCard: {
    backgroundColor: "#5CCAD410",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "#5CCAD430",
  },
  sliderContainer: {
    marginBottom: 16,
  },
  sliderLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sliderAmount: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10605A",
    marginBottom: 12,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  simulatorResult: {
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  resultLabel: {
    fontSize: 12,
    color: "#666666",
    marginBottom: 4,
  },
  resultValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#10605A",
  },
  coachDivider: {
    height: 1,
    backgroundColor: "#E0E0E0",
    marginTop: 8,
  },
});
