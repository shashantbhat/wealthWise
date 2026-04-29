import {
    ExpenseCategory,
    MonthlyData,
} from "@/app/utils/expenseStorageOptimized";

export interface CategoryTrend {
  category: ExpenseCategory;
  currentMonth: number;
  previousMonth: number;
  change: number;
  changePercent: number;
  trend: "up" | "down" | "stable";
}

export interface SavingsMetrics {
  income: number;
  expenses: number;
  savingsAmount: number;
  savingsRate: number; // percentage
  targetSavingsRate: number;
  meetsTarget: boolean;
}

export interface MonthEndForecast {
  currentPace: number; // daily average
  projectedTotal: number;
  daysRemaining: number;
  daysElapsed: number;
  currentSpent: number;
  variance: number; // over/under monthly income
}

export interface SmartNudge {
  type: "warning" | "achievement" | "suggestion" | "forecast";
  title: string;
  message: string;
  priority: "high" | "medium" | "low";
  actionable: boolean;
}

export function calculateCategoryTrends(
  currentMonthData: MonthlyData,
  previousMonthData: MonthlyData | null,
): CategoryTrend[] {
  if (!previousMonthData) {
    return [];
  }

  const trends: CategoryTrend[] = [];
  const categories = Object.keys(
    currentMonthData.categoryBreakdown,
  ) as ExpenseCategory[];

  categories.forEach((category) => {
    const current = currentMonthData.categoryBreakdown[category] || 0;
    const previous = previousMonthData.categoryBreakdown[category] || 0;
    const change = current - previous;
    const changePercent = previous > 0 ? (change / previous) * 100 : 0;

    let trend: "up" | "down" | "stable" = "stable";
    if (Math.abs(changePercent) > 5) {
      trend = change > 0 ? "up" : "down";
    }

    trends.push({
      category,
      currentMonth: current,
      previousMonth: previous,
      change,
      changePercent,
      trend,
    });
  });

  return trends.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}

export function calculateSavingsMetrics(
  monthlyIncome: number,
  currentExpenses: number,
  targetSavingsRate: number = 20, // default 20%
): SavingsMetrics {
  const savingsAmount = monthlyIncome - currentExpenses;
  const savingsRate =
    monthlyIncome > 0 ? (savingsAmount / monthlyIncome) * 100 : 0;

  return {
    income: monthlyIncome,
    expenses: currentExpenses,
    savingsAmount,
    savingsRate,
    targetSavingsRate,
    meetsTarget: savingsRate >= targetSavingsRate,
  };
}

export function calculateMonthEndForecast(
  monthlyIncome: number,
  currentSpent: number,
  daysElapsed: number,
): MonthEndForecast {
  const daysInMonth = 30; // Simplified, can be made more accurate
  const daysRemaining = Math.max(0, daysInMonth - daysElapsed);
  const dailyPace = daysElapsed > 0 ? currentSpent / daysElapsed : 0;
  const projectedTotal = currentSpent + dailyPace * daysRemaining;
  const variance = projectedTotal - monthlyIncome;

  return {
    currentPace: dailyPace,
    projectedTotal,
    daysRemaining,
    daysElapsed,
    currentSpent,
    variance,
  };
}

export function generateSmartNudges(
  savings: SavingsMetrics,
  forecast: MonthEndForecast,
  trends: CategoryTrend[],
  salaryDay: number = 1,
): SmartNudge[] {
  const nudges: SmartNudge[] = [];
  const now = new Date();
  const dayOfMonth = now.getDate();

  // Budget warning
  if (forecast.variance > 0) {
    nudges.push({
      type: "warning",
      title: "Spending Forecast Alert",
      message: `At your current pace, you'll overspend by ₹${forecast.variance.toFixed(0)} this month. Time to cut back!`,
      priority: "high",
      actionable: true,
    });
  }

  // Savings achievement
  if (savings.meetsTarget) {
    nudges.push({
      type: "achievement",
      title: "Great Savings Pace! 🎯",
      message: `You're on track to save ${savings.savingsRate.toFixed(1)}% this month, exceeding your ${savings.targetSavingsRate}% target.`,
      priority: "medium",
      actionable: false,
    });
  } else if (savings.savingsRate < savings.targetSavingsRate / 2) {
    nudges.push({
      type: "warning",
      title: "Savings Goal at Risk",
      message: `Current savings rate: ${savings.savingsRate.toFixed(1)}%. You need to save ${(savings.targetSavingsRate - savings.savingsRate).toFixed(1)}% more.`,
      priority: "high",
      actionable: true,
    });
  }

  // Category trend warnings
  const upTrends = trends.filter(
    (t) => t.trend === "up" && t.changePercent > 10,
  );
  upTrends.slice(0, 2).forEach((trend) => {
    nudges.push({
      type: "suggestion",
      title: `${trend.category} Spending Up`,
      message: `${trend.category} is up ${trend.changePercent.toFixed(1)}% vs last month. Watch this category!`,
      priority: "medium",
      actionable: true,
    });
  });

  // Salary day context
  const daysUntilSalary =
    salaryDay >= dayOfMonth
      ? salaryDay - dayOfMonth
      : 30 - dayOfMonth + salaryDay;
  if (daysUntilSalary <= 3 && daysUntilSalary > 0) {
    nudges.push({
      type: "forecast",
      title: "Salary Day Incoming",
      message: `Salary day in ${daysUntilSalary} days. Plan your goals and investments!`,
      priority: "low",
      actionable: false,
    });
  }

  // Current savings rate context
  if (!savings.meetsTarget && forecast.daysRemaining > 5) {
    const dailySavingsNeeded =
      (savings.income * (savings.targetSavingsRate / 100)) / 30;
    const currentDaily = savings.expenses / Math.max(1, forecast.daysElapsed);
    const reduction =
      currentDaily -
      (savings.income - dailySavingsNeeded * forecast.daysRemaining) /
        forecast.daysRemaining;

    if (reduction > 0) {
      nudges.push({
        type: "suggestion",
        title: "Daily Spending Target",
        message: `Reduce daily spending by ₹${reduction.toFixed(0)} to hit your savings goal.`,
        priority: "medium",
        actionable: true,
      });
    }
  }

  return nudges.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}
