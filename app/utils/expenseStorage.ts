import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export type ExpenseCategory =
  | "Food"
  | "Travel"
  | "Shopping"
  | "Health"
  | "Entertainment"
  | "Accommodation"
  | "Wellness";

/** Single expense entry for a specific day */
export interface DailyExpense {
  id: string; // UUID for unique identification
  category: ExpenseCategory;
  amount: number;
  description?: string;
  timestamp: number; // Unix timestamp
}

/** All expenses for a single day */
export interface DayData {
  date: string; // "YYYY-MM-DD" format
  expenses: DailyExpense[];
  totalSpent: number; // Calculated sum
}

/** All days in a month (detailed daily breakdown) */
export interface MonthlyData {
  year: number;
  month: number; // 1-12
  days: DayData[];
  monthlyTotal: number; // Sum of all days
  categoryBreakdown: Record<ExpenseCategory, number>; // Total per category
}

/** Aggregated week data (used after month ends) */
export interface WeekData {
  weekNumber: number;
  startDate: string; // "YYYY-MM-DD"
  endDate: string; // "YYYY-MM-DD"
  weeklyTotal: number;
  categoryBreakdown: Record<ExpenseCategory, number>;
}

/** Aggregated month data (used for historical records) */
export interface ArchivedMonth {
  year: number;
  month: number;
  monthlyTotal: number;
  weeks: WeekData[];
  categoryBreakdown: Record<ExpenseCategory, number>;
  archivedDate: number; // When this was archived (Unix timestamp)
}

/** Root storage structure */
export interface ExpenseStore {
  currentMonth: MonthlyData | null; // Currently active month
  archivedMonths: ArchivedMonth[]; // Historical months (aggregated)
  lastUpdated: number; // Last modification timestamp
}

// ─── Constants ───────────────────────────────────────────────────────────────

const STORAGE_KEY = "wealthwise_expenses";

const DEFAULT_EXPENSE_STORE: ExpenseStore = {
  currentMonth: null,
  archivedMonths: [],
  lastUpdated: Date.now(),
};

export const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  "Food",
  "Travel",
  "Shopping",
  "Health",
  "Entertainment",
  "Accommodation",
  "Wellness",
];

// ─── Utility Functions ────────────────────────────────────────────────────────

/**
 * Generate a unique ID for expense (simple UUID-like string)
 */
function generateExpenseId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get current date in "YYYY-MM-DD" format
 */
function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Get year and month from date
 */
function getYearMonth(date: Date = new Date()): {
  year: number;
  month: number;
} {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

/**
 * Initialize empty category breakdown
 */
export function initializeCategoryBreakdown(): Record<ExpenseCategory, number> {
  const breakdown: Record<string, number> = {};
  EXPENSE_CATEGORIES.forEach((cat) => {
    breakdown[cat] = 0;
  });
  return breakdown as Record<ExpenseCategory, number>;
}

/**
 * Get week number from date (ISO week number)
 */
function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

/**
 * Get Monday of the week for a given date
 */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

// ─── Main Storage Functions ──────────────────────────────────────────────────

/**
 * Load expense store from local storage
 */
export async function loadExpenseStore(): Promise<ExpenseStore> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as ExpenseStore;
      return parsed;
    }
    return DEFAULT_EXPENSE_STORE;
  } catch (error) {
    console.error("Error loading expense store:", error);
    return DEFAULT_EXPENSE_STORE;
  }
}

/**
 * Save expense store to local storage
 */
async function saveExpenseStore(store: ExpenseStore): Promise<void> {
  try {
    store.lastUpdated = Date.now();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (error) {
    console.error("Error saving expense store:", error);
    throw error;
  }
}

/**
 * Initialize or get current month's data
 */
async function initializeCurrentMonth(
  store: ExpenseStore,
  forceYearMonth?: { year: number; month: number },
): Promise<MonthlyData> {
  const { year, month } = forceYearMonth || getYearMonth();

  // Check if current month data exists and is for same month
  if (
    store.currentMonth &&
    store.currentMonth.year === year &&
    store.currentMonth.month === month
  ) {
    return store.currentMonth;
  }

  // Create new month data
  const newMonth: MonthlyData = {
    year,
    month,
    days: [],
    monthlyTotal: 0,
    categoryBreakdown: initializeCategoryBreakdown(),
  };

  return newMonth;
}

/**
 * Add a single expense to the current month
 */
export async function addExpense(
  category: ExpenseCategory,
  amount: number,
  description?: string,
): Promise<void> {
  const store = await loadExpenseStore();

  // Initialize or get current month
  store.currentMonth = await initializeCurrentMonth(store);

  // Get today's date
  const today = getDateString();

  // Find or create today's entry
  let dayData = store.currentMonth.days.find((d) => d.date === today);

  if (!dayData) {
    dayData = {
      date: today,
      expenses: [],
      totalSpent: 0,
    };
    store.currentMonth.days.push(dayData);
  }

  // Add expense
  const expense: DailyExpense = {
    id: generateExpenseId(),
    category,
    amount,
    description,
    timestamp: Date.now(),
  };

  dayData.expenses.push(expense);

  // Recalculate totals
  dayData.totalSpent = dayData.expenses.reduce((sum, e) => sum + e.amount, 0);
  store.currentMonth.monthlyTotal = store.currentMonth.days.reduce(
    (sum, d) => sum + d.totalSpent,
    0,
  );

  // Update category breakdown
  store.currentMonth.categoryBreakdown = initializeCategoryBreakdown();
  store.currentMonth.days.forEach((d) => {
    d.expenses.forEach((e) => {
      store.currentMonth!.categoryBreakdown[e.category] += e.amount;
    });
  });

  await saveExpenseStore(store);
}

/**
 * Delete a specific expense
 */
export async function deleteExpense(expenseId: string): Promise<void> {
  const store = await loadExpenseStore();

  if (!store.currentMonth) {
    return;
  }

  // Find and remove expense
  let found = false;
  store.currentMonth.days.forEach((day) => {
    const index = day.expenses.findIndex((e) => e.id === expenseId);
    if (index !== -1) {
      day.expenses.splice(index, 1);
      found = true;

      // Recalculate day total
      day.totalSpent = day.expenses.reduce((sum, e) => sum + e.amount, 0);

      // Remove day if no expenses
      if (day.expenses.length === 0) {
        const dayIndex = store.currentMonth!.days.indexOf(day);
        store.currentMonth!.days.splice(dayIndex, 1);
      }
    }
  });

  if (found) {
    // Recalculate totals
    store.currentMonth.monthlyTotal = store.currentMonth.days.reduce(
      (sum, d) => sum + d.totalSpent,
      0,
    );

    // Update category breakdown
    store.currentMonth.categoryBreakdown = initializeCategoryBreakdown();
    store.currentMonth.days.forEach((d) => {
      d.expenses.forEach((e) => {
        store.currentMonth!.categoryBreakdown[e.category] += e.amount;
      });
    });

    await saveExpenseStore(store);
  }
}

/**
 * Get current month's expenses
 */
export async function getCurrentMonthExpenses(): Promise<MonthlyData | null> {
  const store = await loadExpenseStore();
  return store.currentMonth || null;
}

/**
 * Get all expenses for today
 */
export async function getTodayExpenses(): Promise<DayData | null> {
  const store = await loadExpenseStore();

  if (!store.currentMonth) {
    return null;
  }

  const today = getDateString();
  return store.currentMonth.days.find((d) => d.date === today) || null;
}

/**
 * Get expense summary for current month
 */
export async function getCurrentMonthSummary(): Promise<{
  total: number;
  byCategory: Record<ExpenseCategory, number>;
} | null> {
  const month = await getCurrentMonthExpenses();

  if (!month) {
    return null;
  }

  return {
    total: month.monthlyTotal,
    byCategory: month.categoryBreakdown,
  };
}

// ─── Month-End Aggregation ────────────────────────────────────────────────────

/**
 * Aggregate daily data into weeks
 */
function aggregateIntoWeeks(month: MonthlyData): WeekData[] {
  const weekMap = new Map<number, DayData[]>();

  // Group days by week
  month.days.forEach((day) => {
    const date = new Date(day.date);
    const weekNum = getWeekNumber(date);
    if (!weekMap.has(weekNum)) {
      weekMap.set(weekNum, []);
    }
    weekMap.get(weekNum)!.push(day);
  });

  // Convert to WeekData
  const weeks: WeekData[] = [];
  Array.from(weekMap.entries())
    .sort(([a], [b]) => a - b)
    .forEach(([weekNum, days]) => {
      const categoryBreakdown = initializeCategoryBreakdown();
      let weeklyTotal = 0;

      days.forEach((day) => {
        day.expenses.forEach((expense) => {
          categoryBreakdown[expense.category] += expense.amount;
          weeklyTotal += expense.amount;
        });
      });

      const firstDay = new Date(days[0].date);
      const lastDay = new Date(days[days.length - 1].date);

      weeks.push({
        weekNumber: weekNum,
        startDate: getDateString(firstDay),
        endDate: getDateString(lastDay),
        weeklyTotal,
        categoryBreakdown,
      });
    });

  return weeks;
}

/**
 * Archive current month (run at month-end)
 * This converts detailed daily data into weekly + monthly summaries
 */
export async function archiveCurrentMonth(): Promise<void> {
  const store = await loadExpenseStore();

  if (!store.currentMonth) {
    return;
  }

  // Create archived month with week aggregations
  const archivedMonth: ArchivedMonth = {
    year: store.currentMonth.year,
    month: store.currentMonth.month,
    monthlyTotal: store.currentMonth.monthlyTotal,
    weeks: aggregateIntoWeeks(store.currentMonth),
    categoryBreakdown: store.currentMonth.categoryBreakdown,
    archivedDate: Date.now(),
  };

  // Add to archived months
  store.archivedMonths.push(archivedMonth);

  // Clear current month
  store.currentMonth = null;

  await saveExpenseStore(store);
}

/**
 * Get archived month data
 */
export async function getArchivedMonth(
  year: number,
  month: number,
): Promise<ArchivedMonth | null> {
  const store = await loadExpenseStore();
  return (
    store.archivedMonths.find((m) => m.year === year && m.month === month) ||
    null
  );
}

/**
 * Get all archived months (for historical view)
 */
export async function getAllArchivedMonths(): Promise<ArchivedMonth[]> {
  const store = await loadExpenseStore();
  return store.archivedMonths.sort(
    (a, b) => b.year * 12 + b.month - (a.year * 12 + a.month),
  );
}

/**
 * Delete an archived month
 */
export async function deleteArchivedMonth(
  year: number,
  month: number,
): Promise<void> {
  const store = await loadExpenseStore();

  const index = store.archivedMonths.findIndex(
    (m) => m.year === year && m.month === month,
  );

  if (index !== -1) {
    store.archivedMonths.splice(index, 1);
    await saveExpenseStore(store);
  }
}

// ─── Export Raw Data ──────────────────────────────────────────────────────────

/**
 * Export current month as JSON
 */
export async function exportCurrentMonthAsJSON(): Promise<string> {
  const store = await loadExpenseStore();
  return JSON.stringify(store.currentMonth, null, 2);
}

/**
 * Export all data as JSON
 */
export async function exportAllDataAsJSON(): Promise<string> {
  const store = await loadExpenseStore();
  return JSON.stringify(store, null, 2);
}

/**
 * Clear all expense data (use with caution)
 */
export async function clearAllExpenses(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
