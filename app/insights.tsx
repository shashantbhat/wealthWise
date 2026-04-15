import {
    ArchivedMonth,
    DailyExpense,
    getAllArchivedMonths,
    getCurrentMonthByWeeks,
    WeeklyTransaction,
} from "@/app/utils/expenseStorage";
import PrimarySvgExpenseChart from "@/components/primary-expense-chart";
import { useExpenses } from "@/context/expense-context";
import { useUser } from "@/context/user-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const EXPENSE_CATEGORIES = [
  { name: "Food", icon: "🍔", color: "#FF6B6B" },
  { name: "Travel", icon: "🚗", color: "#4ECDC4" },
  { name: "Shopping", icon: "🛍️", color: "#FFE66D" },
  { name: "Health", icon: "🏥", color: "#95E1D3" },
  { name: "Entertainment", icon: "🎬", color: "#C7CEEA" },
  { name: "Accommodation", icon: "🏠", color: "#FF9F43" },
  { name: "Wellness", icon: "💆", color: "#A8E6CF" },
];

interface MonthSummary {
  year: number;
  month: number;
  monthName: string;
  total: number;
  categoryBreakdown: Record<string, number>;
  isCurrentMonth: boolean;
}

export default function InsightsScreen() {
  const { currentMonth, loading: contextLoading } = useExpenses();
  const { monthlyIncome } = useUser();
  const router = useRouter();
  const [archivedMonths, setArchivedMonths] = useState<ArchivedMonth[]>([]);
  const [monthSummaries, setMonthSummaries] = useState<MonthSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<MonthSummary | null>(null);
  const [weeklyData, setWeeklyData] = useState<WeeklyTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load archived months
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const archived = await getAllArchivedMonths();
        setArchivedMonths(archived);

        // Build month summaries
        const summaries: MonthSummary[] = [];

        // Add current month if available
        if (currentMonth) {
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          const now = new Date();
          summaries.push({
            year: now.getFullYear(),
            month: now.getMonth(),
            monthName: monthNames[now.getMonth()],
            total: currentMonth.monthlyTotal,
            categoryBreakdown: currentMonth.categoryBreakdown,
            isCurrentMonth: true,
          });
        }

        // Add archived months
        archived.forEach((arch) => {
          const monthNames = [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
          // Skip if it's the same month/year as current month
          const now = new Date();
          if (
            arch.year === now.getFullYear() &&
            arch.month === now.getMonth() + 1
          ) {
            return;
          }
          summaries.push({
            year: arch.year,
            month: arch.month,
            monthName: monthNames[arch.month - 1],
            total: arch.monthlyTotal,
            categoryBreakdown: arch.categoryBreakdown,
            isCurrentMonth: false,
          });
        });

        setMonthSummaries(summaries);
        if (summaries.length > 0) {
          setSelectedMonth(summaries[0]);
        }
      } catch (error) {
        console.error("Error loading archived months:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentMonth]);

  // Load weekly data for current month
  useEffect(() => {
    const loadWeeklyData = async () => {
      if (selectedMonth?.isCurrentMonth) {
        const weeks = await getCurrentMonthByWeeks();
        setWeeklyData(weeks);
      } else {
        setWeeklyData([]);
      }
    };

    loadWeeklyData();
  }, [selectedMonth]);

  if (loading || contextLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#14B8A6" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="#1A1A1A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Insights</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Month Selector */}
        {monthSummaries.length > 0 && (
          <View style={styles.monthSelector}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {monthSummaries.map((month, idx) => (
                <TouchableOpacity
                  key={idx}
                  onPress={() => setSelectedMonth(month)}
                  style={[
                    styles.monthButton,
                    selectedMonth?.month === month.month &&
                    selectedMonth?.year === month.year
                      ? styles.monthButtonActive
                      : styles.monthButtonInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.monthButtonText,
                      selectedMonth?.month === month.month &&
                      selectedMonth?.year === month.year
                        ? styles.monthButtonTextActive
                        : styles.monthButtonTextInactive,
                    ]}
                  >
                    {month.monthName} {month.year}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Selected Month Details */}
        {selectedMonth && (
          <>
            {/* Budget Summary Card */}
            <View style={styles.budgetCard}>
              <Text style={styles.budgetCardTitle}>
                {selectedMonth.monthName} {selectedMonth.year} • Budget Summary
              </Text>

              {/* Monthly Income */}
              <View style={styles.budgetSection}>
                <Text style={styles.budgetLabel}>Monthly Income</Text>
                <Text style={styles.budgetAmount}>
                  ₹{monthlyIncome?.toLocaleString("en-IN") || "0"}
                </Text>
              </View>

              {/* Monthly Spending */}
              <View style={styles.budgetSection}>
                <Text style={styles.budgetLabel}>Total Spending</Text>
                <Text style={styles.budgetAmount}>
                  ₹{selectedMonth.total.toFixed(0)}
                </Text>
              </View>

              {/* Budget Remaining */}
              {monthlyIncome && (
                <View style={styles.budgetSection}>
                  <Text style={styles.budgetLabel}>Budget Remaining</Text>
                  <Text
                    style={[
                      styles.budgetAmount,
                      monthlyIncome - selectedMonth.total < 0 &&
                        styles.budgetAmountNegative,
                    ]}
                  >
                    ₹{(monthlyIncome - selectedMonth.total).toFixed(0)}
                  </Text>
                </View>
              )}

              {/* Budget Progress Bar */}
              {monthlyIncome && (
                <View style={styles.progressContainer}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressText}>
                      {((selectedMonth.total / monthlyIncome) * 100).toFixed(1)}
                      % spent
                    </Text>
                    <Text style={styles.progressText}>
                      {(
                        100 -
                        (selectedMonth.total / monthlyIncome) * 100
                      ).toFixed(1)}
                      % remaining
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.min((selectedMonth.total / monthlyIncome) * 100, 100)}%`,
                        },
                      ]}
                    />
                  </View>
                </View>
              )}
            </View>

            {/* Category Distribution Chart */}
            {Object.values(selectedMonth.categoryBreakdown).some(
              (v) => v > 0,
            ) && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Category Distribution</Text>
                <PrimarySvgExpenseChart
                  categories={selectedMonth.categoryBreakdown}
                  total={selectedMonth.total}
                />
              </View>
            )}

            {/* Category Breakdown List */}
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Spending by Category</Text>
              {EXPENSE_CATEGORIES.map((cat) => {
                const amount = selectedMonth.categoryBreakdown[cat.name] || 0;
                const percentage =
                  selectedMonth.total > 0
                    ? ((amount / selectedMonth.total) * 100).toFixed(1)
                    : "0";

                return (
                  <View key={cat.name}>
                    {amount > 0 && (
                      <View style={styles.categoryRow}>
                        <View style={styles.categoryInfo}>
                          <Text style={styles.categoryIcon}>{cat.icon}</Text>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.categoryName}>{cat.name}</Text>
                            <View
                              style={[
                                styles.categoryBar,
                                {
                                  width: (amount / selectedMonth.total) * 250,
                                  backgroundColor: cat.color,
                                },
                              ]}
                            />
                          </View>
                        </View>
                        <View style={styles.categoryAmount}>
                          <Text style={styles.categoryPercent}>
                            {percentage}%
                          </Text>
                          <Text style={styles.categoryValue}>
                            ₹{amount.toFixed(0)}
                          </Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>

            {/* Weekly Transactions for Current Month */}
            {selectedMonth?.isCurrentMonth && weeklyData.length > 0 && (
              <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Transactions by Week</Text>
                {weeklyData.map((week) => (
                  <View key={week.weekNumber} style={styles.weekContainer}>
                    <View style={styles.weekHeader}>
                      <View>
                        <Text style={styles.weekTitle}>
                          Week {week.weekNumber}
                        </Text>
                        <Text style={styles.weekDates}>
                          {week.startDate} - {week.endDate}
                        </Text>
                      </View>
                      <Text style={styles.weekTotal}>
                        ₹{week.weeklyTotal.toFixed(0)}
                      </Text>
                    </View>

                    {/* Days in this week */}
                    {week.days.map((day) => (
                      <View key={day.date} style={styles.dayContainer}>
                        <Text style={styles.dayDate}>{day.date}</Text>
                        {day.expenses.map((expense: DailyExpense) => {
                          const category = EXPENSE_CATEGORIES.find(
                            (c) => c.name === expense.category,
                          );
                          return (
                            <View
                              key={expense.id}
                              style={styles.transactionRow}
                            >
                              <View style={styles.transactionInfo}>
                                <Text style={styles.transactionIcon}>
                                  {category?.icon || "💰"}
                                </Text>
                                <View style={{ flex: 1 }}>
                                  <Text style={styles.transactionCategory}>
                                    {expense.category}
                                  </Text>
                                  {expense.description && (
                                    <Text style={styles.transactionDescription}>
                                      {expense.description}
                                    </Text>
                                  )}
                                </View>
                              </View>
                              <Text style={styles.transactionAmount}>
                                ₹{expense.amount.toFixed(0)}
                              </Text>
                            </View>
                          );
                        })}
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  monthSelector: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  monthButton: {
    marginRight: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  monthButtonActive: {
    backgroundColor: "#14B8A6",
  },
  monthButtonInactive: {
    backgroundColor: "#E5E7EB",
  },
  monthButtonText: {
    fontWeight: "600",
    fontSize: 14,
  },
  monthButtonTextActive: {
    color: "#FFFFFF",
  },
  monthButtonTextInactive: {
    color: "#374151",
  },
  budgetCard: {
    marginHorizontal: 24,
    marginBottom: 24,
    backgroundColor: "#14B8A6",
    borderRadius: 16,
    padding: 24,
  },
  budgetCardTitle: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 16,
  },
  budgetSection: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.3)",
  },
  budgetLabel: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 4,
  },
  budgetAmount: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },
  budgetAmountNegative: {
    color: "#FCA5A5",
  },
  progressContainer: {
    marginTop: 12,
  },
  progressLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progressText: {
    color: "rgba(255, 255, 255, 0.75)",
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 4,
  },
  sectionContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1A1A1A",
    marginBottom: 12,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  categoryInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  categoryIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  categoryName: {
    fontWeight: "600",
    color: "#1F2937",
    marginBottom: 4,
  },
  categoryBar: {
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  categoryAmount: {
    alignItems: "flex-end",
    marginLeft: 12,
  },
  categoryPercent: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  categoryValue: {
    fontWeight: "700",
    color: "#1F2937",
  },
  weekContainer: {
    marginBottom: 20,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
  },
  weekHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#E0F2F1",
    borderBottomWidth: 1,
    borderBottomColor: "#B2DFDB",
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#00695C",
    marginBottom: 4,
  },
  weekDates: {
    fontSize: 12,
    color: "#00897B",
  },
  weekTotal: {
    fontSize: 18,
    fontWeight: "700",
    color: "#00695C",
  },
  dayContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  dayDate: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginBottom: 8,
    textTransform: "uppercase",
  },
  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 4,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#14B8A6",
  },
  transactionInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  transactionIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  transactionCategory: {
    fontWeight: "600",
    color: "#1F2937",
    fontSize: 13,
  },
  transactionDescription: {
    fontSize: 12,
    color: "#9CA3AF",
    marginTop: 2,
  },
  transactionAmount: {
    fontWeight: "700",
    color: "#1F2937",
    fontSize: 13,
    marginLeft: 12,
  },
});
