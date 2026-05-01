import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    ArchivedMonth,
    ExpenseCategory,
    ExpenseStore,
    MonthlyData,
    WeekData,
    initializeCategoryBreakdown
} from "./expenseStorage";

const STORAGE_KEY = "wealthwise_expenses";

// Sample expense data for seeding
const SAMPLE_EXPENSES = [
  {
    category: "Food" as ExpenseCategory,
    amount: 450,
    description: "Lunch at cafe",
  },
  {
    category: "Food" as ExpenseCategory,
    amount: 320,
    description: "Groceries",
  },
  {
    category: "Travel" as ExpenseCategory,
    amount: 150,
    description: "Uber to office",
  },
  {
    category: "Shopping" as ExpenseCategory,
    amount: 1200,
    description: "New shoes",
  },
  {
    category: "Entertainment" as ExpenseCategory,
    amount: 500,
    description: "Movie tickets",
  },
  {
    category: "Health" as ExpenseCategory,
    amount: 800,
    description: "Gym membership",
  },
  {
    category: "Accommodation" as ExpenseCategory,
    amount: 2500,
    description: "Rent",
  },
  {
    category: "Wellness" as ExpenseCategory,
    amount: 350,
    description: "Spa treatment",
  },
  { category: "Food" as ExpenseCategory, amount: 280, description: "Dinner" },
  { category: "Travel" as ExpenseCategory, amount: 200, description: "Gas" },
];

/**
 * Generate sample expenses for a specific date
 */
function generateSampleExpensesForDate(
  baseDate: Date,
  count: number = 3,
): Array<{ category: ExpenseCategory; amount: number; description?: string }> {
  const expenses = [];
  for (let i = 0; i < count; i++) {
    const sample =
      SAMPLE_EXPENSES[Math.floor(Math.random() * SAMPLE_EXPENSES.length)];
    expenses.push({
      ...sample,
      amount: sample.amount + Math.random() * 500, // Add variance
    });
  }
  return expenses;
}

/**
 * Create a week data object
 */
function createWeekData(
  weekNumber: number,
  startDate: string,
  endDate: string,
  expenses: Array<{ amount: number; category: ExpenseCategory }>,
): WeekData {
  const breakdown = initializeCategoryBreakdown();
  const weeklyTotal = expenses.reduce((sum, exp) => {
    breakdown[exp.category] += exp.amount;
    return sum + exp.amount;
  }, 0);

  return {
    weekNumber,
    startDate,
    endDate,
    weeklyTotal,
    categoryBreakdown: breakdown,
  };
}

/**
 * Create archived month data for previous months
 */
function createArchivedMonth(year: number, month: number): ArchivedMonth {
  const expenses = [];
  const weeks: WeekData[] = [];
  let currentWeek = 1;
  let weekStartDate = `${year}-${String(month).padStart(2, "0")}-01`;
  let weekEndDate = weekStartDate;

  // Generate expenses for the month
  const daysInMonth = new Date(year, month, 0).getDate();

  const weekExpenses: Array<{ amount: number; category: ExpenseCategory }> = [];

  for (let day = 1; day <= daysInMonth; day++) {
    const dayExpenses = generateSampleExpensesForDate(
      new Date(year, month - 1, day),
      Math.floor(Math.random() * 3) + 1,
    );

    dayExpenses.forEach((exp) => {
      expenses.push(exp);
      weekExpenses.push(exp);
    });

    // Create week boundaries (Sunday to Saturday)
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 6 || day === daysInMonth) {
      // Saturday or last day of month
      const weekData = createWeekData(
        currentWeek,
        weekStartDate,
        `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
        weekExpenses,
      );
      weeks.push(weekData);

      // Reset for next week
      currentWeek++;
      weekExpenses.length = 0;
      if (day < daysInMonth) {
        weekStartDate = `${year}-${String(month).padStart(2, "0")}-${String(day + 1).padStart(2, "0")}`;
      }
    }
  }

  // Calculate totals
  const categoryBreakdown = initializeCategoryBreakdown();
  let monthlyTotal = 0;

  expenses.forEach((exp) => {
    categoryBreakdown[exp.category] += exp.amount;
    monthlyTotal += exp.amount;
  });

  return {
    year,
    month,
    monthlyTotal,
    weeks,
    categoryBreakdown,
    archivedDate: Date.now(),
  };
}

/**
 * Seed the app with sample data
 */
export async function seedSampleData(): Promise<void> {
  try {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    // Create archived months for previous 2 months
    const archivedMonths: ArchivedMonth[] = [];

    // Previous 2 months
    for (let i = 2; i > 0; i--) {
      let month = currentMonth - i;
      let year = currentYear;

      if (month <= 0) {
        month += 12;
        year -= 1;
      }

      archivedMonths.push(createArchivedMonth(year, month));
    }

    // Create current month with deterministic sample data (~₹35,000)
    const currentMonthData: MonthlyData = {
      year: currentYear,
      month: currentMonth,
      days: [],
      monthlyTotal: 0,
      categoryBreakdown: initializeCategoryBreakdown(),
    };

    // Target totals by category (INR)
    const categoryTargets: Record<string, number> = {
      Shopping: 5000, // 25% over default 4000 budget
      Food: 7000, // 40% over default 5000 budget (eating out heavy)
      Accommodation: 15000,
      Travel: 3500,
      Health: 1500,
      Entertainment: 2000,
      Wellness: 1000,
    };

    // Distribute transactions across a set of dates in the month
    const dateSlots = [2, 5, 8, 11, 14, 17, 20, 23, 26, 29];
    const daysMap: Record<string, Array<{ category: ExpenseCategory; amount: number; description?: string }>> = {};

    const monthStr = String(currentMonth).padStart(2, "0");
    dateSlots.forEach((d) => {
      const date = `${currentYear}-${monthStr}-${String(d).padStart(2, "0")}`;
      daysMap[date] = [];
    });

    // Split each category total evenly across the date slots
    Object.entries(categoryTargets).forEach(([cat, total]) => {
      const parts = dateSlots.length;
      const base = Math.floor(total / parts);
      let remainder = total % parts;

      for (let i = 0; i < parts; i++) {
        const amount = base + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder -= 1;

        // push expense only if amount > 0
        if (amount > 0) {
          const date = `${currentYear}-${monthStr}-${String(dateSlots[i]).padStart(2, "0")}`;
          daysMap[date].push({ category: cat as ExpenseCategory, amount, description: `${cat} expense` });
        }
      }
    });

    // Convert daysMap into DayData entries
    Object.entries(daysMap).forEach(([dateStr, exps]) => {
      const dayExpenses = exps.map((exp) => ({
        id: `${dateStr}-${Math.random().toString(36).substr(2, 9)}`,
        category: exp.category,
        amount: Math.round(exp.amount * 100) / 100,
        description: exp.description,
        timestamp: new Date(dateStr).getTime(),
      }));

      const totalSpent = dayExpenses.reduce((s, e) => s + e.amount, 0);

      currentMonthData.days.push({
        date: dateStr,
        expenses: dayExpenses,
        totalSpent,
      });

      // Update breakdown
      dayExpenses.forEach((e) => {
        currentMonthData.categoryBreakdown[e.category] += e.amount;
        currentMonthData.monthlyTotal += e.amount;
      });
    });

    // Save to AsyncStorage
    const store: ExpenseStore = {
      currentMonth: currentMonthData,
      archivedMonths,
      lastUpdated: Date.now(),
    };

    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    console.log("Sample data seeded successfully!");
  } catch (error) {
    console.error("Error seeding sample data:", error);
    throw error;
  }
}

/**
 * Clear all expense data
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    console.log("All data cleared!");
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}
