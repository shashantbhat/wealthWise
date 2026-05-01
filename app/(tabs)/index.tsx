import { loadBudgets, saveBudgets } from "@/app/utils/budgetsGoalsStorage";
import {
  clearExpenseStore,
  getCurrentWeekExpenses,
  getYearToDateExpenses,
  populateSampleData,
} from "@/app/utils/expenseStorageOptimized";
import { AlertsModal } from "@/components/home/AlertsModal";
import { BudgetModal } from "@/components/home/BudgetModal";
import { HomeHeader } from "@/components/home/HomeHeader";
import { InsightsSection } from "@/components/home/InsightsSection";
import { LogButtons } from "@/components/home/LogButtons";
import { ManualLogModal } from "@/components/home/ManualLogModal";
import { RecentExpenses } from "@/components/home/RecentExpenses";
import { ReportTabs } from "@/components/home/ReportTabs";
import { SpendingRingSection } from "@/components/home/SpendingRingSection";
import { Expense, ReportType } from "@/components/home/types";
import { VoiceLogModal } from "@/components/home/VoiceLogModal";
import {
  useExpenses,
  type ExpenseCategory,
} from "@/context/expenseContextOptimized";
import { useUser } from "@/context/user-context";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
} from "react-native";

export default function HomeScreen() {
  const { userName, monthlyIncome } = useUser();
  const { currentMonth, todayExpenses, monthlyTotal, addExpense } =
    useExpenses();
  const router = useRouter();

  const [hideAmounts, setHideAmounts] = useState(false);
  const [selectedReportType, setSelectedReportType] =
    useState<ReportType>("monthly");
  const [budgets, setBudgets] = useState<Record<string, number>>({});
  const [showManualModal, setShowManualModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);

  // Dynamic data based on report type
  const [weekData, setWeekData] = useState<{
    total: number;
    breakdown: Record<string, number>;
  } | null>(null);
  const [yearData, setYearData] = useState<{
    total: number;
    breakdown: Record<string, number>;
  } | null>(null);

  // Load budgets on mount
  useEffect(() => {
    loadBudgets()
      .then(setBudgets)
      .catch((error) => console.error("Failed to load budgets:", error));
  }, []);

  // Load week/year data when report type changes
  useEffect(() => {
    if (selectedReportType === "weekly") {
      setYearData(null); // Clear yearly data when not needed
      getCurrentWeekExpenses()
        .then((data) => {
          setWeekData({
            total: data.weeklyTotal,
            breakdown: data.categoryBreakdown,
          });
        })
        .catch((error) => console.error("Failed to load week data:", error));
    } else if (selectedReportType === "yearly") {
      setWeekData(null); // Clear weekly data when not needed
      getYearToDateExpenses()
        .then((data) => {
          console.log("Yearly data loaded:", data); // Debug log
          setYearData({
            total: data.yearlyTotal,
            breakdown: data.categoryBreakdown,
          });
        })
        .catch((error) => console.error("Failed to load year data:", error));
    } else {
      // Monthly view - clear both week and year data
      setWeekData(null);
      setYearData(null);
    }
  }, [selectedReportType]); // Removed monthlyTotal dependency for yearly data

  // Save budgets whenever they change
  useEffect(() => {
    if (Object.keys(budgets).length > 0) {
      saveBudgets(budgets).catch((error) =>
        console.error("Failed to save budgets:", error),
      );
    }
  }, [budgets]);

  // Convert context expenses to display format
  const displayExpenses = useMemo<Expense[]>(() => {
    if (!todayExpenses) return [];
    return todayExpenses.expenses.map((exp, idx) => ({
      id: idx,
      category: exp.category,
      amount: exp.amount,
      description: exp.description || exp.category,
      date: "Today",
    }));
  }, [todayExpenses]);

  // Determine display data based on selected report type
  const displayData = useMemo(() => {
    switch (selectedReportType) {
      case "weekly":
        console.log("Weekly display data:", weekData);
        return {
          total: Math.max(0, weekData?.total ?? 0),
          breakdown: weekData?.breakdown ?? {},
        };
      case "yearly":
        console.log("Yearly display data:", yearData);
        return {
          total: Math.max(0, yearData?.total ?? 0),
          breakdown: yearData?.breakdown ?? {},
        };
      case "monthly":
      default:
        return {
          total: Math.max(0, monthlyTotal ?? 0),
          breakdown: currentMonth?.categoryBreakdown ?? {},
        };
    }
  }, [selectedReportType, weekData, yearData, monthlyTotal, currentMonth]);

  // Use dynamic data for spending calculations
  const spendingByCategory = useMemo(() => {
    return displayData.breakdown;
  }, [displayData]);

  const exceededBudgets = Object.keys(budgets).filter(
    (category) =>
      (spendingByCategory as Record<string, number>)[category] !== undefined &&
      (spendingByCategory as Record<string, number>)[category] >
        budgets[category],
  );

  // Calculate effective budget and progress based on report type
  const effectiveBudgetCalc = useMemo(() => {
    const baseIncome =
      monthlyIncome && monthlyIncome > 0 ? monthlyIncome : 50000;

    switch (selectedReportType) {
      case "weekly":
        // Weekly budget is approximately monthly/4
        return baseIncome / 4;
      case "yearly":
        // Yearly budget is monthly * 12
        return baseIncome * 12;
      case "monthly":
      default:
        return baseIncome;
    }
  }, [monthlyIncome, selectedReportType]);

  const progress = displayData.total / effectiveBudgetCalc;
  const percentage = Math.round(Math.min(progress, 1) * 100);
  const isOverBudget = displayData.total > effectiveBudgetCalc;

  const handleAddExpense = async (expense: Omit<Expense, "id" | "date">) => {
    try {
      await addExpense(
        expense.category as ExpenseCategory,
        expense.amount,
        expense.description,
      );
    } catch (error) {
      console.error("Error adding expense:", error);
    }
  };

  const handleReportTypeChange = (type: ReportType) => {
    setSelectedReportType(type);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        <HomeHeader
          userName={userName}
          onProfilePress={() => router.push("/profile")}
        />

        <ReportTabs
          selectedReportType={selectedReportType}
          onTabPress={handleReportTypeChange}
          onBudgetPress={() => setShowBudgetModal(true)}
          exceededBudgetsCount={exceededBudgets.length}
          onAlertPress={() => setShowAlertsModal(true)}
        />

        <SpendingRingSection
          reportType={selectedReportType}
          progress={progress}
          percentage={percentage}
          totalLocalSpent={displayData.total}
          effectiveBudget={effectiveBudgetCalc}
          isOverBudget={isOverBudget}
          hideAmounts={hideAmounts}
          onToggleHide={() => setHideAmounts((v) => !v)}
        />

        <LogButtons
          onVoiceLog={() => setShowVoiceModal(true)}
          onManualLog={() => setShowManualModal(true)}
        />

        {/* Temporary debug buttons for testing */}
        {/* <TouchableOpacity
          style={{
            backgroundColor: "#007AFF",
            padding: 10,
            borderRadius: 8,
            marginVertical: 10,
          }}
          onPress={async () => {
            try {
              await populateSampleData();
              alert("Sample data populated! Refresh the app to see changes.");
            } catch (error) {
              alert("Error populating sample data: " + error);
            }
          }}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: "bold" }}
          >
            Populate Sample Data (Debug)
          </Text>
        </TouchableOpacity> */}

        {/* <TouchableOpacity
          style={{
            backgroundColor: "#FF3B30",
            padding: 10,
            borderRadius: 8,
            marginVertical: 10,
          }}
          onPress={async () => {
            try {
              await clearExpenseStore();
              alert("All expenses cleared! Refresh the app to see changes.");
            } catch (error) {
              alert("Error clearing expenses: " + error);
            }
          }}
        >
          <Text
            style={{ color: "white", textAlign: "center", fontWeight: "bold" }}
          >
            Clear All Expenses (Debug)
          </Text>
        </TouchableOpacity> */}

        <InsightsSection
          spendingByCategory={spendingByCategory}
          totalSpent={displayData.total}
          budgets={budgets}
          reportType={selectedReportType}
          hideAmounts={hideAmounts}
          onPress={() => router.push("/insights")}
        />

        <RecentExpenses
          expenses={displayExpenses}
          hideAmounts={hideAmounts}
          onToggleHide={() => setHideAmounts((v) => !v)}
        />
      </ScrollView>

      <ManualLogModal
        visible={showManualModal}
        onClose={() => setShowManualModal(false)}
        onSubmit={handleAddExpense}
        budgets={budgets}
        spendingByCategory={spendingByCategory}
      />

      <VoiceLogModal
        visible={showVoiceModal}
        onClose={() => setShowVoiceModal(false)}
        onSubmit={handleAddExpense}
        budgets={budgets}
        spendingByCategory={spendingByCategory}
      />

      <BudgetModal
        visible={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        budgets={budgets}
        spendingByCategory={spendingByCategory}
        onUpdateBudget={(category, amount) =>
          setBudgets((prev) => ({ ...prev, [category]: amount }))
        }
        hideAmounts={hideAmounts}
      />

      <AlertsModal
        visible={showAlertsModal}
        onClose={() => setShowAlertsModal(false)}
        exceededBudgets={exceededBudgets}
        spendingByCategory={spendingByCategory}
        budgets={budgets}
        hideAmounts={hideAmounts}
        onViewBudgets={() => {
          setShowAlertsModal(false);
          setShowBudgetModal(true);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F0F0" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
});
