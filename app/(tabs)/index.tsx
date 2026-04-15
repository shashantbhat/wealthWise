import { AlertsModal } from "@/components/home/AlertsModal";
import { BudgetModal } from "@/components/home/BudgetModal";
import { HomeHeader } from "@/components/home/HomeHeader";
import { InsightsSection } from "@/components/home/InsightsSection";
import { LogButtons } from "@/components/home/LogButtons";
import { ManualLogModal } from "@/components/home/ManualLogModal";
import { RecentExpenses } from "@/components/home/RecentExpenses";
import { ReportModal } from "@/components/home/ReportModal";
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
import React, { useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StatusBar, StyleSheet } from "react-native";

const DEFAULT_BUDGETS: Record<string, number> = {
  Food: 5000,
  Travel: 3000,
  Shopping: 4000,
  Health: 2000,
  Entertainment: 2000,
  Accommodation: 8000,
  Wellness: 1500,
  Other: 1000,
};

export default function HomeScreen() {
  const { userName, monthlyIncome } = useUser();
  const { currentMonth, todayExpenses, monthlyTotal, addExpense } =
    useExpenses();
  const router = useRouter();

  const [hideAmounts, setHideAmounts] = useState(false);
  const [selectedReportType, setSelectedReportType] =
    useState<ReportType>("monthly");
  const [budgets, setBudgets] =
    useState<Record<string, number>>(DEFAULT_BUDGETS);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showVoiceModal, setShowVoiceModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);

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

  // Use context data for spending calculations
  const spendingByCategory = useMemo(() => {
    return currentMonth?.categoryBreakdown || {};
  }, [currentMonth]);

  const exceededBudgets = Object.keys(budgets).filter(
    (category) =>
      spendingByCategory[category] !== undefined &&
      spendingByCategory[category] > budgets[category],
  );

  const effectiveBudget = monthlyIncome > 0 ? monthlyIncome : 50000;
  const progress = monthlyTotal / effectiveBudget;
  const percentage = Math.round(Math.min(progress, 1) * 100);
  const isOverBudget = monthlyTotal > effectiveBudget;

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
          onTabPress={(type) => {
            setSelectedReportType(type);
            setShowReportModal(true);
          }}
          onBudgetPress={() => setShowBudgetModal(true)}
          exceededBudgetsCount={exceededBudgets.length}
          onAlertPress={() => setShowAlertsModal(true)}
        />

        <SpendingRingSection
          progress={progress}
          percentage={percentage}
          totalLocalSpent={monthlyTotal}
          effectiveBudget={effectiveBudget}
          isOverBudget={isOverBudget}
          hideAmounts={hideAmounts}
          onToggleHide={() => setHideAmounts((v) => !v)}
        />

        <LogButtons
          onVoiceLog={() => setShowVoiceModal(true)}
          onManualLog={() => setShowManualModal(true)}
        />

        <InsightsSection
          spendingByCategory={spendingByCategory}
          monthlySpent={monthlyTotal}
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

      <ReportModal
        visible={showReportModal}
        onClose={() => setShowReportModal(false)}
        selectedReportType={selectedReportType}
        expenses={displayExpenses}
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
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
});
