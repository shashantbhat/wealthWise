import { Button } from "@/components/ui/primary-button";
import { useUser } from "@/context/user-context";
import quotesData from "@/data/quotes.json";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Dimensions,
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
import Svg, { Circle } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const CATEGORY_ICONS: Record<
  string,
  React.ComponentProps<typeof Ionicons>["name"]
> = {
  Food: "restaurant-outline",
  Travel: "car-outline",
  Shopping: "bag-outline",
  Health: "medical-outline",
  Entertainment: "film-outline",
  Accommodation: "home-outline",
  Wellness: "fitness-outline",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatINR(amount: number) {
  return "₹" + amount.toLocaleString("en-IN");
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

function getRandomQuote(): string {
  const allQuotes = quotesData.wealth_advice_quotes.flatMap(
    (category) => category.quotes,
  );
  return allQuotes[Math.floor(Math.random() * allQuotes.length)];
}

// ─── Ring Chart (SVG donut) ───────────────────────────────────────────────────
const RING_SIZE = Math.min(SCREEN_WIDTH * 0.62, 240);
const STROKE = 20;
const RING_RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function RingChart({ progress }: { progress: number }) {
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = CIRCUMFERENCE * (1 - clamped);
  const center = RING_SIZE / 2;

  return (
    <Svg
      width={RING_SIZE}
      height={RING_SIZE}
      style={{ transform: [{ rotate: "-90deg" }] }}
    >
      {/* Track - Light Grey Background */}
      <Circle
        cx={center}
        cy={center}
        r={RING_RADIUS}
        stroke="#E8E8E8"
        strokeWidth={STROKE}
        fill="none"
      />
      {/* Progress arc - solid black, fills by percentage */}
      <Circle
        cx={center}
        cy={center}
        r={RING_RADIUS}
        stroke="#000000"
        strokeWidth={STROKE}
        fill="none"
        strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { userName, monthlyIncome, monthlySpent, addExpense } = useUser();
  const router = useRouter();
  const [expenses, setExpenses] = useState<
    {
      id: number;
      category: string;
      description: string;
      amount: number;
      date: string;
    }[]
  >([]);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [hideAmounts, setHideAmounts] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [selectedReportType, setSelectedReportType] = useState<
    "weekly" | "monthly" | "yearly"
  >("monthly");
  const [budgets, setBudgets] = useState<Record<string, number>>({
    Food: 5000,
    Travel: 3000,
    Shopping: 4000,
    Health: 2000,
    Entertainment: 2000,
    Accommodation: 8000,
    Wellness: 1500,
    Other: 1000,
  });
  const [budgetInputs, setBudgetInputs] = useState<Record<string, string>>({
    Food: "5000",
    Travel: "3000",
    Shopping: "4000",
    Health: "2000",
    Entertainment: "2000",
    Accommodation: "8000",
    Wellness: "1500",
    Other: "1000",
  });

  // Helper function to conditionally mask amounts
  const displayAmount = (amount: number) => {
    return hideAmounts ? "₹ ----" : formatINR(amount);
  };

  // Calculate spending by category
  const spendingByCategory = expenses.reduce(
    (acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    },
    {} as Record<string, number>,
  );

  // Check for budget exceeded categories
  const exceededBudgets = Object.keys(budgets).filter(
    (category) =>
      spendingByCategory[category] &&
      spendingByCategory[category] > budgets[category],
  );

  // Helper function to get date range based on report type
  const getDateRange = (type: "weekly" | "monthly" | "yearly") => {
    const today = new Date();
    let start = new Date();

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
  };

  // Helper function to filter expenses by date
  const getExpensesByPeriod = (type: "weekly" | "monthly" | "yearly") => {
    // const { start } = getDateRange(type);
    return expenses.filter((exp) => {
      // For demo purposes, assume all expenses are from today
      // In production, you'd parse exp.date properly
      return true;
    });
  };

  // Generate report data
  const generateReport = (type: "weekly" | "monthly" | "yearly") => {
    const periodExpenses = getExpensesByPeriod(type);
    const totalSpent = periodExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const categoryBreakdown = periodExpenses.reduce(
      (acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    const { start } = getDateRange(type);
    const dateRange =
      type === "weekly"
        ? `Last 7 days`
        : type === "monthly"
          ? `${start.toLocaleDateString("en-US", { month: "long" })}`
          : `Year ${start.getFullYear()}`;

    return {
      totalSpent,
      categoryBreakdown,
      dateRange,
      expenseCount: periodExpenses.length,
      averagePerDay:
        totalSpent / (type === "weekly" ? 7 : type === "monthly" ? 30 : 365),
    };
  };

  // Manual log form state
  const [manualDescription, setManualDescription] = useState("");
  const [manualAmount, setManualAmount] = useState("");
  const [manualCategory, setManualCategory] = useState("Food");

  // Voice log form state
  const [voiceInput, setVoiceInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const CATEGORIES = [
    "Food",
    "Travel",
    "Shopping",
    "Health",
    "Entertainment",
    "Accommodation",
    "Wellness",
    "Other",
  ];

  const totalLocalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const effectiveBudget = monthlyIncome > 0 ? monthlyIncome : 50000;
  const remaining = effectiveBudget - totalLocalSpent;
  const progress = totalLocalSpent / effectiveBudget;
  const percentage = Math.round(Math.min(progress, 1) * 100);
  const isOverBudget = totalLocalSpent > effectiveBudget;

  const handleManualLogSubmit = () => {
    if (!manualDescription.trim() || !manualAmount.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const amount = parseFloat(manualAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid amount");
      return;
    }

    const newExpense = {
      id: expenses.length + 1,
      category: manualCategory,
      description: manualDescription,
      amount: amount,
      date: "Today",
    };

    // Check if this would exceed category budget
    const currentCategorySpend = spendingByCategory[manualCategory] || 0;
    const newCategorySpend = currentCategorySpend + amount;
    const categoryBudget = budgets[manualCategory];
    const willExceed = newCategorySpend > categoryBudget;

    setExpenses([newExpense, ...expenses]);
    addExpense(amount);
    setManualDescription("");
    setManualAmount("");
    setManualCategory("Food");
    setShowManualModal(false);

    if (willExceed) {
      Alert.alert(
        "⚠️ Budget Alert",
        `Expense of ${formatINR(amount)} logged! \n\nYour ${manualCategory} budget (${formatINR(categoryBudget)}) will be exceeded by ${formatINR(newCategorySpend - categoryBudget)}`,
      );
    } else {
      Alert.alert(
        "Success",
        `Expense of ${formatINR(amount)} logged successfully!`,
      );
    }
  };

  const handleVoiceLog = () => {
    if (!voiceInput.trim()) {
      Alert.alert("Error", "Please say or enter your expense");
      return;
    }

    // Parse voice input (simplified: "200 food" or "200 swiggy food")
    const parts = voiceInput.toLowerCase().trim().split(" ");
    const amount = parseFloat(parts[0]);

    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please start with the expense amount");
      return;
    }

    // Try to detect category from remaining words
    let category = "Other";
    const voiceWords = parts.slice(1).join(" ");

    for (const cat of CATEGORIES) {
      if (voiceWords.includes(cat.toLowerCase())) {
        category = cat;
        break;
      }
    }

    const description = voiceInput.substring(voiceInput.search(/\D/));

    const newExpense = {
      id: expenses.length + 1,
      category: category,
      description: description || category,
      amount: amount,
      date: "Today",
    };

    // Check if this would exceed category budget
    const currentCategorySpend = spendingByCategory[category] || 0;
    const newCategorySpend = currentCategorySpend + amount;
    const categoryBudget = budgets[category];
    const willExceed = newCategorySpend > categoryBudget;

    setExpenses([newExpense, ...expenses]);
    addExpense(amount);
    setVoiceInput("");
    setShowVoiceModal(false);

    if (willExceed) {
      Alert.alert(
        "⚠️ Budget Alert",
        `Expense of ${formatINR(amount)} logged! \n\nYour ${category} budget (${formatINR(categoryBudget)}) will be exceeded by ${formatINR(newCategorySpend - categoryBudget)}`,
      );
    } else {
      Alert.alert(
        "Success",
        `Expense of ${formatINR(amount)} logged successfully!`,
      );
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerLeft}
            onPress={() => router.push("/profile")}
            activeOpacity={0.7}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>
                {userName ? userName.charAt(0).toUpperCase() : "U"}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        <View className="flex-row">
          <Text style={styles.greeting}>{getGreeting()},</Text>
          <Text style={styles.userName}>{userName || "User"}</Text>
        </View>

        {/* ── Report Tabs + Notification ──────────────────────────────── */}
        <View style={styles.reportTabsRow}>
          <View style={styles.reportTabs}>
            {(["Weekly", "Monthly", "Yearly"] as const).map((tab) => {
              const type = tab.toLowerCase() as "weekly" | "monthly" | "yearly";
              return (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.reportTab,
                    selectedReportType === type && styles.reportTabActive,
                  ]}
                  onPress={() => {
                    setSelectedReportType(type);
                    setShowReportModal(true);
                  }}
                >
                  <Text
                    style={[
                      styles.reportTabText,
                      selectedReportType === type && styles.reportTabTextActive,
                    ]}
                  >
                    {tab}
                  </Text>
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity
              style={styles.reportTab}
              onPress={() => setShowBudgetModal(true)}
            >
              <Text style={styles.reportTabText}>Budget</Text>
            </TouchableOpacity>
          </View>
          {exceededBudgets.length > 0 ? (
            <TouchableOpacity
              style={[styles.notifBtn, styles.notifBtnAlert]}
              onPress={() => setShowAlertsModal(true)}
            >
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#1A1A1A"
              />
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {exceededBudgets.length}
                </Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.notifBtn}>
              <Ionicons
                name="notifications-outline"
                size={20}
                color="#CCCCCC"
              />
            </View>
          )}
        </View>

        {/* ── Ring Chart ─────────────────────────────────────────────── */}
        <View style={styles.ringSection}>
          <View style={styles.ringTitleRow}>
            <Text style={styles.ringTitle}>
              {new Date().toLocaleDateString("en-US", { month: "long" })}
            </Text>
            <TouchableOpacity
              style={styles.hideToggleBtn}
              onPress={() => setHideAmounts(!hideAmounts)}
            >
              <Ionicons
                name={hideAmounts ? "eye-outline" : "eye-off-outline"}
                size={18}
                color="#666666"
              />
            </TouchableOpacity>
          </View>

          <View style={styles.ringWrapper}>
            <RingChart progress={progress} />

            {/* Centre label (sits inside the ring hole) */}
            <View style={styles.ringCenter}>
              <Text
                style={[
                  styles.ringPct,
                  {
                    color: isOverBudget ? "#555555" : "#1A1A1A",
                  },
                ]}
              >
                {percentage}%
              </Text>
              <Text style={styles.percentageLabel}>Spent</Text>
              <Text style={styles.ringSpentAmt}>
                {displayAmount(totalLocalSpent)}
              </Text>
              <Text style={styles.ringSubText}>
                of {displayAmount(effectiveBudget)}
              </Text>
            </View>
          </View>

          {isOverBudget && (
            <View style={styles.overBudgetBadge}>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
              >
                <Ionicons name="warning-outline" size={14} color="#555555" />
                <Text style={styles.overBudgetText}>
                  Over budget this month
                </Text>
              </View>
            </View>
          )}

          {/* Motivational Quote */}
          <View style={styles.quoteContainer}>
            <Text style={styles.quoteText}>&#34;{getRandomQuote()}&#34;</Text>
          </View>
        </View>

        {/* ── Expense Logging Buttons ────────────────────────────────── */}
        <View style={styles.logButtonsContainer}>
          <TouchableOpacity
            style={[styles.logBtn, styles.voiceLogBtn]}
            onPress={() => setShowVoiceModal(true)}
            activeOpacity={0.75}
          >
            <Ionicons
              name="mic-outline"
              size={28}
              color="#1A1A1A"
              style={styles.logBtnIcon}
            />
            <Text style={styles.logBtnTitle}>Voice Log</Text>
            <Text style={styles.logBtnSub}>Speak expense</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.logBtn, styles.textLogBtn]}
            onPress={() => setShowManualModal(true)}
            activeOpacity={0.75}
          >
            <Ionicons
              name="create-outline"
              size={28}
              color="#1A1A1A"
              style={styles.logBtnIcon}
            />
            <Text style={styles.logBtnTitle}>Manual Log</Text>
            <Text style={styles.logBtnSub}>Type expense</Text>
          </TouchableOpacity>
        </View>

        {/* ── Insights ──────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Insights</Text>
        {Object.keys(spendingByCategory).length === 0 ? (
          <Text style={styles.emptyText}>No expenses to analyze</Text>
        ) : (
          <View style={styles.insightsContainer}>
            {Object.entries(spendingByCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([category, amount]) => {
                const percentage = (amount / monthlySpent) * 100;
                return (
                  <View key={category} style={styles.insightItem}>
                    <View style={styles.insightCategoryInfo}>
                      <View
                        style={[
                          styles.insightCategory,
                          {
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 6,
                          },
                        ]}
                      >
                        <Ionicons
                          name={CATEGORY_ICONS[category] ?? "card-outline"}
                          size={14}
                          color="#555"
                        />
                        <Text style={styles.insightCategoryText}>
                          {category}
                        </Text>
                      </View>
                      <View style={styles.insightProgressBar}>
                        <View
                          style={[
                            styles.insightProgressFill,
                            { width: `${percentage}%` },
                          ]}
                        />
                      </View>
                    </View>
                    <View style={styles.insightAmount}>
                      <Text style={styles.insightAmountValue}>
                        {displayAmount(amount)}
                      </Text>
                      <Text style={styles.insightPercentage}>
                        {Math.round(percentage)}%
                      </Text>
                    </View>
                  </View>
                );
              })}
          </View>
        )}

        {/* ── Recent Expenses ────────────────────────────────────────── */}
        <View style={styles.expensesHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Expenses</Text>
          <TouchableOpacity
            style={styles.hideExpensesBtn}
            onPress={() => setHideAmounts(!hideAmounts)}
          >
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
      </ScrollView>

      {/* ── Manual Log Modal ──────────────────────────────────────────── */}
      <Modal
        visible={showManualModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowManualModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Expense Manually</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Amount (₹) *</Text>
                <View style={styles.amountInputWrapper}>
                  <Text style={styles.currencySymbol}>₹</Text>
                  <TextInput
                    style={styles.amountInput}
                    value={manualAmount}
                    onChangeText={setManualAmount}
                    placeholder="0"
                    keyboardType="decimal-pad"
                    placeholderTextColor="#666"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description *</Text>
                <TextInput
                  style={styles.textInput}
                  value={manualDescription}
                  onChangeText={setManualDescription}
                  placeholder="e.g., Lunch at cafe"
                  placeholderTextColor="#666"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryBtn,
                        manualCategory === cat && styles.categoryBtnActive,
                      ]}
                      onPress={() => setManualCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.categoryBtnText,
                          manualCategory === cat &&
                            styles.categoryBtnTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                text="Cancel"
                onPress={() => {
                  setShowManualModal(false);
                  setManualDescription("");
                  setManualAmount("");
                  setManualCategory("Food");
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                text="Log Expense"
                onPress={handleManualLogSubmit}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Voice Log Modal ──────────────────────────────────────────── */}
      <Modal
        visible={showVoiceModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVoiceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Expense by Voice</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.voiceModalScroll}
            >
              <View style={styles.voiceInfo}>
                <Text style={styles.voiceInfoText}>
                  Say the amount and category
                </Text>
                <Text style={styles.voiceExample}>
                  Example: &quot;₹500 food&quot; or &quot;₹2500 shopping&quot;
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.recordBtn,
                  isRecording && styles.recordBtnActive,
                ]}
                onPress={() => setIsRecording(!isRecording)}
              >
                <Ionicons
                  name="mic-outline"
                  size={40}
                  color={isRecording ? "#555555" : "#1A1A1A"}
                />
                <Text style={styles.recordBtnText}>
                  {isRecording ? "Stop Recording" : "Start Recording"}
                </Text>
              </TouchableOpacity>

              {voiceInput && (
                <View style={styles.voiceInputBox}>
                  <Text style={styles.voiceInputLabel}>You said:</Text>
                  <TextInput
                    style={styles.voiceInputField}
                    value={voiceInput}
                    onChangeText={setVoiceInput}
                    placeholder="Or type your expense here..."
                    placeholderTextColor="#666"
                  />
                </View>
              )}

              {!voiceInput && isRecording && (
                <View style={styles.recordingIndicator}>
                  <View style={styles.recordingDot} />
                  <Text style={styles.recordingText}>Recording...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                text="Cancel"
                onPress={() => {
                  setShowVoiceModal(false);
                  setVoiceInput("");
                  setIsRecording(false);
                }}
                variant="outline"
                style={styles.modalButton}
              />
              <Button
                text={voiceInput ? "Log Expense" : "Skip"}
                onPress={
                  voiceInput
                    ? handleVoiceLog
                    : () => {
                        setShowVoiceModal(false);
                        setVoiceInput("");
                        setIsRecording(false);
                      }
                }
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Budget Management Modal ────────────────────────────────── */}
      <Modal
        visible={showBudgetModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Set Category Budgets</Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {CATEGORIES.map((category) => {
                const spent = spendingByCategory[category] || 0;
                const budgetLimit = budgets[category];
                const isExceeded = spent > budgetLimit;
                const percentage =
                  budgetLimit > 0 ? (spent / budgetLimit) * 100 : 0;

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
                        {Math.round(percentage)}%
                      </Text>
                    </View>

                    {/* Progress Bar */}
                    <View style={styles.budgetProgressBar}>
                      <View
                        style={[
                          styles.budgetProgressFill,
                          {
                            width: `${Math.min(percentage, 100)}%`,
                            backgroundColor: isExceeded ? "#555555" : "#1A1A1A",
                          },
                        ]}
                      />
                    </View>

                    {/* Budget Input */}
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
                            setBudgets((prev) => ({
                              ...prev,
                              [category]: newAmount,
                            }));
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
              <Button
                text="Close"
                onPress={() => setShowBudgetModal(false)}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Reports Modal ──────────────────────────────────────────── */}
      <Modal
        visible={showReportModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {selectedReportType === "weekly"
                ? "Weekly Report"
                : selectedReportType === "monthly"
                  ? "Monthly Report"
                  : "Yearly Report"}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {(() => {
                const report = generateReport(selectedReportType);
                return (
                  <>
                    {/* Report Summary */}
                    <View style={styles.reportSummary}>
                      <View style={styles.reportSummaryItem}>
                        <Text style={styles.reportSummaryLabel}>Period</Text>
                        <Text style={styles.reportSummaryValue}>
                          {report.dateRange}
                        </Text>
                      </View>
                      <View style={styles.reportSummaryItem}>
                        <Text style={styles.reportSummaryLabel}>
                          Total Spent
                        </Text>
                        <Text
                          style={[
                            styles.reportSummaryValue,
                            { color: "#1A1A1A" },
                          ]}
                        >
                          {displayAmount(report.totalSpent)}
                        </Text>
                      </View>
                      <View style={styles.reportSummaryItem}>
                        <Text style={styles.reportSummaryLabel}>
                          Transactions
                        </Text>
                        <Text style={styles.reportSummaryValue}>
                          {report.expenseCount}
                        </Text>
                      </View>
                      <View style={styles.reportSummaryItem}>
                        <Text style={styles.reportSummaryLabel}>
                          Daily Average
                        </Text>
                        <Text style={styles.reportSummaryValue}>
                          {displayAmount(report.averagePerDay)}
                        </Text>
                      </View>
                    </View>

                    {/* Category Breakdown */}
                    <Text style={styles.reportSectionTitle}>
                      Category Breakdown
                    </Text>
                    {Object.keys(report.categoryBreakdown).length === 0 ? (
                      <Text style={styles.reportEmptyText}>
                        No expenses in this period
                      </Text>
                    ) : (
                      Object.entries(report.categoryBreakdown).map(
                        ([category, amount]) => {
                          const percentage = (amount / report.totalSpent) * 100;
                          return (
                            <View
                              key={category}
                              style={styles.reportCategoryItem}
                            >
                              <View style={styles.reportCategoryInfo}>
                                <Text style={styles.reportCategoryName}>
                                  {category}
                                </Text>
                                <View style={styles.reportCategoryProgressBar}>
                                  <View
                                    style={[
                                      styles.reportCategoryProgressFill,
                                      {
                                        width: `${percentage}%`,
                                      },
                                    ]}
                                  />
                                </View>
                              </View>
                              <View style={styles.reportCategoryAmount}>
                                <Text style={styles.reportCategoryValue}>
                                  {displayAmount(amount)}
                                </Text>
                                <Text style={styles.reportCategoryPercent}>
                                  {Math.round(percentage)}%
                                </Text>
                              </View>
                            </View>
                          );
                        },
                      )
                    )}
                  </>
                );
              })()}
            </ScrollView>

            <View style={styles.modalButtons}>
              <Button
                text="Close"
                onPress={() => setShowReportModal(false)}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Alerts Modal ───────────────────────────────────────────── */}
      <Modal
        visible={showAlertsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAlertsModal(false)}
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
                const percentage = (spent / budgetLimit) * 100;

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
                      <Text style={styles.alertPercent}>
                        {Math.round(percentage)}%
                      </Text>
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

                    {/* Alert Progress Bar */}
                    <View style={styles.alertProgressBar}>
                      <View
                        style={[
                          styles.alertProgressFill,
                          {
                            width: `${Math.min(percentage, 100)}%`,
                          },
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
                onPress={() => {
                  setShowAlertsModal(false);
                  setShowBudgetModal(true);
                }}
                style={styles.modalButton}
              />
              <Button
                text="Close"
                onPress={() => setShowAlertsModal(false)}
                variant="outline"
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Small stat card ─────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: accent + "55" }]}>
      <Ionicons
        name={icon}
        size={22}
        color={accent}
        style={{ marginBottom: 6 }}
      />
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const CARD_BG = "rgba(255, 255, 255, 0.4)";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // Ring section - Glassmorphic card
  ringSection: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    marginHorizontal: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 18,
    paddingBottom: 6,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#1A1A1A",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { color: "#FFFFFF", fontSize: 22, fontWeight: "800" },
  greeting: { color: "#999999", fontSize: 22 },
  userName: { color: "#1A1A1A", fontSize: 22, fontWeight: "700" },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD_BG,
    justifyContent: "center",
    alignItems: "center",
  },
  notifIcon: { fontSize: 18 },

  ringTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    gap: 12,
  },
  ringTitle: {
    color: "#666666",
    fontSize: 14,
    letterSpacing: 0.6,
  },
  hideToggleBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  hideToggleBtnIcon: {
    width: 18,
    height: 18,
    resizeMode: "contain",
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringPct: {
    fontSize: 38,
    fontWeight: "800",
    lineHeight: 44,
    color: "#1A1A1A",
  },
  percentageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
    marginTop: -2,
    letterSpacing: 0.5,
  },
  ringSpentAmt: {
    color: "#1A1A1A",
    fontSize: 17,
    fontWeight: "600",
    marginTop: 2,
  },
  ringSubText: { color: "#999999", fontSize: 12, marginTop: 2 },
  overBudgetBadge: {
    marginTop: 14,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  overBudgetText: { color: "#555555", fontSize: 13, fontWeight: "600" },

  // Quote section
  quoteContainer: {
    marginTop: 18,
    marginHorizontal: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#555555",
    lineHeight: 18,
    fontWeight: "500",
    textAlign: "center",
  },

  // Stats - Vertical Stack with Glassmorphic Cards
  statsRow: { flexDirection: "column", gap: 12, marginTop: 20 },
  statCard: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
    flexDirection: "column",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    minHeight: 90,
    justifyContent: "center",
  },
  statValue: { fontSize: 16, fontWeight: "800", marginBottom: 6 },
  statLabel: {
    color: "#999999",
    fontSize: 12,
    fontWeight: "600",
    marginTop: 2,
  },

  // Voice button
  voiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#00D09C",
    borderRadius: 18,
    padding: 18,
    marginTop: 22,
  },
  voiceMic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00A882",
    justifyContent: "center",
    alignItems: "center",
  },
  voiceTitle: { color: "#0A2E24", fontSize: 17, fontWeight: "800" },
  voiceSub: { color: "#0D4434", fontSize: 12, marginTop: 2 },
  voiceArrow: { color: "#0A2E24", fontSize: 28, fontWeight: "300" },

  // Reports - Glassmorphic Cards
  sectionTitle: {
    color: "#1A1A1A",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 30,
    marginBottom: 12,
  },
  reportsRow: { flexDirection: "row", gap: 8 },
  reportCard: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: "center",
    gap: 8,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  reportLabel: {
    color: "#1A1A1A",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  // Report tabs
  reportTabsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginTop: 14,
    marginBottom: 4,
  },
  reportTabs: {
    flexDirection: "row" as const,
    gap: 6,
  },
  reportTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  reportTabActive: {
    backgroundColor: "#1A1A1A",
  },
  reportTabText: {
    color: "#666666",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  reportTabTextActive: {
    color: "#FFFFFF",
  },

  // Recent expenses - Glassmorphic
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

  // Log buttons container
  logButtonsContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 22,
    marginBottom: 24,
  },
  logBtn: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 0.5,
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  voiceLogBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  textLogBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.4)",
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  logBtnIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  logBtnTitle: {
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  logBtnSub: {
    color: "#999999",
    fontSize: 11,
  },

  // Modal styles
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
  inputGroup: {
    marginBottom: 20,
  },
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
  modalButton: {
    flex: 1,
  },

  // Voice modal styles
  voiceModalScroll: {
    marginBottom: 16,
  },
  voiceInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  voiceInfoText: {
    color: "#1A1A1A",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  voiceExample: {
    color: "#666666",
    fontSize: 12,
    fontStyle: "italic",
  },
  recordBtn: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  recordBtnActive: {
    borderColor: "#555555",
    backgroundColor: "#F0F0F0",
  },
  recordIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  recordBtnText: {
    color: "#1A1A1A",
    fontSize: 16,
    fontWeight: "600",
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingVertical: 20,
  },
  recordingDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#555555",
  },
  recordingText: {
    color: "#555555",
    fontSize: 14,
    fontWeight: "600",
  },
  voiceInputBox: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  voiceInputLabel: {
    color: "#999999",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "500",
  },
  voiceInputField: {
    backgroundColor: "#FAFAFA",
    borderRadius: 8,
    padding: 12,
    color: "#1A1A1A",
    fontSize: 14,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },

  // Notification badge
  notifBtnAlert: {
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  notifBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#1A1A1A",
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  notifBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },

  // Budget styles - Glassmorphic
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
  budgetSpent: {
    fontSize: 13,
    color: "#666666",
  },
  budgetSpentExceeded: {
    color: "#555555",
    fontWeight: "600",
  },
  budgetPercent: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  budgetPercentExceeded: {
    color: "#555555",
  },
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

  // Report styles - Glassmorphic
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

  // Expenses header and hide button
  expensesHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    marginBottom: 12,
  },
  hideExpensesBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  hideExpensesBtnIcon: {
    width: 24,
    height: 24,
    resizeMode: "contain",
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

  // Alert styles
  alertsSubtitle: {
    fontSize: 14,
    color: "#999999",
    fontWeight: "500",
    marginBottom: 16,
    textAlign: "center",
  },
  alertCard: {
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
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
    backgroundColor: "#E8E8E8",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertIcon: {
    fontSize: 18,
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
    color: "#555555",
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
  alertDetailRow__last: {
    borderBottomWidth: 0,
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
    backgroundColor: "#555555",
    borderRadius: 4,
  },
});
