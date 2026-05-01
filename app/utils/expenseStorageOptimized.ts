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

export interface DailyExpense {
  id: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  timestamp: number;
}

export interface DayData {
  date: string;
  expenses: DailyExpense[];
  totalSpent: number;
}

export interface MonthlyData {
  year: number;
  month: number;
  days: DayData[];
  monthlyTotal: number;
  categoryBreakdown: Record<ExpenseCategory, number>;
}

export interface WeekData {
  weekNumber: number;
  startDate: string;
  endDate: string;
  weeklyTotal: number;
  categoryBreakdown: Record<ExpenseCategory, number>;
}

export interface ArchivedMonth {
  year: number;
  month: number;
  monthlyTotal: number;
  weeks: WeekData[];
  categoryBreakdown: Record<ExpenseCategory, number>;
  archivedDate: number;
}

export interface WeeklyTransaction {
  weekNumber: number;
  startDate: string;
  endDate: string;
  weeklyTotal: number;
  categoryBreakdown: Record<ExpenseCategory, number>;
  days: DayData[];
}

export interface ExpenseStore {
  currentMonth: MonthlyData | null;
  archivedMonths: ArchivedMonth[];
  lastUpdated: number;
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

// ─── In-Memory Cache ──────────────────────────────────────────────────────────
// Minimizes AsyncStorage reads for frequently accessed data

let cachedStore: ExpenseStore | null = null;
let cacheExpiry = 0;
const CACHE_DURATION = 5000; // 5 seconds

function isCacheValid(): boolean {
  return cachedStore !== null && Date.now() - cacheExpiry < CACHE_DURATION;
}

function invalidateCache(): void {
  cachedStore = null;
}

// ─── Precomputed Category Breakdown ────────────────────────────────────────

const DEFAULT_CATEGORY_BREAKDOWN: Record<ExpenseCategory, number> = {
  Food: 0,
  Travel: 0,
  Shopping: 0,
  Health: 0,
  Entertainment: 0,
  Accommodation: 0,
  Wellness: 0,
};

export function initializeCategoryBreakdown(): Record<ExpenseCategory, number> {
  return { ...DEFAULT_CATEGORY_BREAKDOWN };
}

// ─── Utility Functions ────────────────────────────────────────────────────────

function generateExpenseId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getDateString(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getYearMonth(date: Date = new Date()): {
  year: number;
  month: number;
} {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
  };
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

function getWeekNumber(date: Date): number {
  const d = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

function calculateDayTotal(expenses: DailyExpense[]): number {
  return expenses.reduce((sum, e) => sum + e.amount, 0);
}

function calculateCategoryBreakdown(
  days: DayData[],
): Record<ExpenseCategory, number> {
  const breakdown = initializeCategoryBreakdown();
  days.forEach((day) => {
    day.expenses.forEach((expense) => {
      breakdown[expense.category] += expense.amount;
    });
  });
  return breakdown;
}

// ─── Core Storage Functions ────────────────────────────────────────────────────

/**
 * Load expense store with caching
 * @returns Cached store if valid, otherwise loads from AsyncStorage
 */
export async function loadExpenseStore(): Promise<ExpenseStore> {
  if (isCacheValid() && cachedStore) {
    return cachedStore;
  }

  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    const store = stored
      ? (JSON.parse(stored) as ExpenseStore)
      : DEFAULT_EXPENSE_STORE;

    cachedStore = store;
    cacheExpiry = Date.now();
    return store;
  } catch (error) {
    console.error("Error loading expense store:", error);
    return DEFAULT_EXPENSE_STORE;
  }
}

/**
 * Save expense store with optimized writes
 */
async function saveExpenseStore(store: ExpenseStore): Promise<void> {
  try {
    store.lastUpdated = Date.now();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    cachedStore = store;
    cacheExpiry = Date.now();
  } catch (error) {
    console.error("Error saving expense store:", error);
    throw error;
  }
}

/**
 * Clear all expenses (for logout/reset)
 */
export async function clearExpenseStore(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
    invalidateCache();
  } catch (error) {
    console.error("Error clearing expense store:", error);
    throw error;
  }
}

/**
 * Initialize or get current month
 */
async function initializeCurrentMonth(
  store: ExpenseStore,
): Promise<MonthlyData> {
  const { year, month } = getYearMonth();

  if (
    store.currentMonth &&
    store.currentMonth.year === year &&
    store.currentMonth.month === month
  ) {
    return store.currentMonth;
  }

  const newMonth: MonthlyData = {
    year,
    month,
    days: [],
    monthlyTotal: 0,
    categoryBreakdown: initializeCategoryBreakdown(),
  };

  return newMonth;
}

// ─── Expense Operations (Optimized) ────────────────────────────────────────────

/**
 * Add expense with minimal storage writes
 */
export async function addExpense(
  category: ExpenseCategory,
  amount: number,
  description?: string,
): Promise<void> {
  const store = await loadExpenseStore();
  store.currentMonth = await initializeCurrentMonth(store);

  const today = getDateString();
  let dayData = store.currentMonth.days.find((d) => d.date === today);

  if (!dayData) {
    dayData = {
      date: today,
      expenses: [],
      totalSpent: 0,
    };
    store.currentMonth.days.push(dayData);
  }

  dayData.expenses.push({
    id: generateExpenseId(),
    category,
    amount,
    description,
    timestamp: Date.now(),
  });

  // Recalculate only affected totals
  dayData.totalSpent = calculateDayTotal(dayData.expenses);
  store.currentMonth.monthlyTotal = store.currentMonth.days.reduce(
    (sum, d) => sum + d.totalSpent,
    0,
  );
  store.currentMonth.categoryBreakdown = calculateCategoryBreakdown(
    store.currentMonth.days,
  );

  await saveExpenseStore(store);
}

/**
 * Delete expense efficiently
 */
export async function deleteExpense(expenseId: string): Promise<void> {
  const store = await loadExpenseStore();

  if (!store.currentMonth) return;

  let dayIndex = -1;
  let found = false;

  for (let i = 0; i < store.currentMonth.days.length; i++) {
    const day = store.currentMonth.days[i];
    const expenseIndex = day.expenses.findIndex((e) => e.id === expenseId);

    if (expenseIndex !== -1) {
      day.expenses.splice(expenseIndex, 1);
      found = true;

      if (day.expenses.length === 0) {
        dayIndex = i;
      } else {
        day.totalSpent = calculateDayTotal(day.expenses);
      }
      break;
    }
  }

  if (found) {
    if (dayIndex !== -1) {
      store.currentMonth.days.splice(dayIndex, 1);
    }

    store.currentMonth.monthlyTotal = store.currentMonth.days.reduce(
      (sum, d) => sum + d.totalSpent,
      0,
    );
    store.currentMonth.categoryBreakdown = calculateCategoryBreakdown(
      store.currentMonth.days,
    );

    await saveExpenseStore(store);
  }
}

// ─── Query Functions (Optimized for Performance) ────────────────────────────────

/**
 * Get current month expenses
 */
export async function getCurrentMonthExpenses(): Promise<MonthlyData | null> {
  const store = await loadExpenseStore();
  return store.currentMonth || null;
}

/**
 * Get today's expenses only
 */
export async function getTodayExpenses(): Promise<DayData | null> {
  const store = await loadExpenseStore();
  if (!store.currentMonth) return null;

  const today = getDateString();
  return store.currentMonth.days.find((d) => d.date === today) || null;
}

/**
 * Get current month summary (minimal data)
 */
export async function getCurrentMonthSummary(): Promise<{
  total: number;
  byCategory: Record<ExpenseCategory, number>;
} | null> {
  const month = await getCurrentMonthExpenses();
  if (!month) return null;

  return {
    total: month.monthlyTotal,
    byCategory: month.categoryBreakdown,
  };
}

/**
 * Get current month by weeks with optional detailed transactions
 */
export async function getCurrentMonthByWeeks(
  includeTransactions = true,
): Promise<WeeklyTransaction[]> {
  const month = await getCurrentMonthExpenses();

  if (!month || month.days.length === 0) {
    return [];
  }

  const weekMap = new Map<string, DayData[]>();

  month.days.forEach((day) => {
    const date = new Date(day.date);
    const monday = getMonday(date);
    const mondayStr = getDateString(monday);

    if (!weekMap.has(mondayStr)) {
      weekMap.set(mondayStr, []);
    }
    weekMap.get(mondayStr)!.push(day);
  });

  const weeks: WeeklyTransaction[] = [];
  let sequentialWeekNum = 1;

  Array.from(weekMap.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .forEach(([_, days]) => {
      const categoryBreakdown = calculateCategoryBreakdown(days);
      const weeklyTotal = days.reduce((sum, d) => sum + d.totalSpent, 0);

      const firstDay = new Date(days[0].date);
      const lastDay = new Date(days[days.length - 1].date);

      weeks.push({
        weekNumber: sequentialWeekNum,
        startDate: getDateString(firstDay),
        endDate: getDateString(lastDay),
        weeklyTotal,
        categoryBreakdown,
        days: includeTransactions
          ? days.sort(
              (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
            )
          : [],
      });

      sequentialWeekNum++;
    });

  return weeks;
}

// ─── Archive Functions ────────────────────────────────────────────────────────

/**
 * Archive current month efficiently
 */
export async function archiveCurrentMonth(): Promise<void> {
  const store = await loadExpenseStore();

  if (!store.currentMonth) {
    return;
  }

  const weekMap = new Map<string, DayData[]>();

  store.currentMonth.days.forEach((day) => {
    const date = new Date(day.date);
    const monday = getMonday(date);
    const mondayStr = getDateString(monday);

    if (!weekMap.has(mondayStr)) {
      weekMap.set(mondayStr, []);
    }
    weekMap.get(mondayStr)!.push(day);
  });

  const weeks: WeekData[] = [];
  Array.from(weekMap.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .forEach(([_, days]) => {
      const startDate = new Date(days[0].date);
      const endDate = new Date(days[days.length - 1].date);

      weeks.push({
        weekNumber: weeks.length + 1,
        startDate: getDateString(startDate),
        endDate: getDateString(endDate),
        weeklyTotal: days.reduce((sum, d) => sum + d.totalSpent, 0),
        categoryBreakdown: calculateCategoryBreakdown(days),
      });
    });

  const archivedMonth: ArchivedMonth = {
    year: store.currentMonth.year,
    month: store.currentMonth.month,
    monthlyTotal: store.currentMonth.monthlyTotal,
    weeks,
    categoryBreakdown: store.currentMonth.categoryBreakdown,
    archivedDate: Date.now(),
  };

  store.archivedMonths.push(archivedMonth);
  store.currentMonth = null;

  await saveExpenseStore(store);
}

/**
 * Get archived month
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
 * Get all archived months (paginated for large datasets)
 */
export async function getAllArchivedMonths(
  limit = 100,
): Promise<ArchivedMonth[]> {
  const store = await loadExpenseStore();
  return store.archivedMonths
    .sort((a, b) => b.year * 12 + b.month - (a.year * 12 + a.month))
    .slice(0, limit);
}

/**
 * Delete archived month
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

/**
 * Get current week's expenses (Monday to today)
 */
export async function getCurrentWeekExpenses(): Promise<{
  weeklyTotal: number;
  categoryBreakdown: Record<ExpenseCategory, number>;
  days: DayData[];
}> {
  try {
    const store = await loadExpenseStore();
    const month = store.currentMonth;

    const today = new Date();
    const monday = getMonday(today);

    // Use date string comparison to avoid timezone issues
    const mondayStr = getDateString(monday);
    const todayStr = getDateString(today);

    const weekDays = (month?.days ?? []).filter((day) => {
      return day.date >= mondayStr && day.date <= todayStr;
    });

    const archivedWeekTotals = store.archivedMonths
      .flatMap((archivedMonth) => archivedMonth.weeks)
      .filter(
        (week) => week.endDate >= mondayStr && week.startDate <= todayStr,
      );

    const weeklyTotalFromCurrent = weekDays.reduce(
      (sum, d) => sum + (d.totalSpent || 0),
      0,
    );
    const weeklyTotalFromArchived = archivedWeekTotals.reduce(
      (sum, week) => sum + (week.weeklyTotal || 0),
      0,
    );
    const weeklyTotal = Math.max(
      0,
      weeklyTotalFromCurrent + weeklyTotalFromArchived,
    );

    const categoryBreakdown = archivedWeekTotals.reduce((breakdown, week) => {
      Object.entries(week.categoryBreakdown || {}).forEach(([cat, amount]) => {
        breakdown[cat as ExpenseCategory] += Math.max(0, amount || 0);
      });
      return breakdown;
    }, calculateCategoryBreakdown(weekDays));

    return {
      weeklyTotal: isNaN(weeklyTotal) ? 0 : weeklyTotal,
      categoryBreakdown,
      days: weekDays,
    };
  } catch (error) {
    console.error("Error in getCurrentWeekExpenses:", error);
    return {
      weeklyTotal: 0,
      categoryBreakdown: initializeCategoryBreakdown(),
      days: [],
    };
  }
}

/**
 * Get year-to-date expenses (Jan 1 to today)
 */
export async function getYearToDateExpenses(): Promise<{
  yearlyTotal: number;
  categoryBreakdown: Record<ExpenseCategory, number>;
  months: (MonthlyData | ArchivedMonth)[];
}> {
  try {
    const store = await loadExpenseStore();
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    let yearlyTotal = 0;
    const categoryBreakdown = initializeCategoryBreakdown();
    const months: (MonthlyData | ArchivedMonth)[] = [];

    // Add archived months from current year (before current month)
    store.archivedMonths
      .filter((m) => m.year === currentYear && m.month < currentMonth)
      .forEach((m) => {
        const monthTotal = Math.max(0, m.monthlyTotal || 0);
        yearlyTotal += monthTotal;
        Object.entries(m.categoryBreakdown || {}).forEach(([cat, amount]) => {
          categoryBreakdown[cat as ExpenseCategory] += Math.max(0, amount || 0);
        });
        months.push(m);
      });

    // Add current month (all days up to today)
    if (
      store.currentMonth &&
      store.currentMonth.year === currentYear &&
      store.currentMonth.month === currentMonth
    ) {
      // Use date string comparison to avoid timezone issues
      const todayStr = getDateString(today);
      const relevantDays = store.currentMonth.days.filter(
        (day) => day.date <= todayStr,
      );

      const currentMonthTotal = Math.max(
        0,
        relevantDays.reduce((sum, d) => sum + (d.totalSpent || 0), 0),
      );
      yearlyTotal += currentMonthTotal;

      const currentCategoryBreakdown = calculateCategoryBreakdown(relevantDays);
      Object.entries(currentCategoryBreakdown).forEach(([cat, amount]) => {
        categoryBreakdown[cat as ExpenseCategory] += Math.max(0, amount || 0);
      });

      months.push(store.currentMonth);
    }

    return {
      yearlyTotal: Math.max(0, isNaN(yearlyTotal) ? 0 : yearlyTotal),
      categoryBreakdown,
      months,
    };
  } catch (error) {
    console.error("Error in getYearToDateExpenses:", error);
    return {
      yearlyTotal: 0,
      categoryBreakdown: initializeCategoryBreakdown(),
      months: [],
    };
  }
}

/**
 * Clear all expense data
 */
export async function clearAllExpenses(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  invalidateCache();
}

/**
 * Clear cache (for testing)
 */
export function clearCache(): void {
  invalidateCache();
}

/**
 * Populate sample data for testing (creates realistic expenses across categories)
 */
export async function populateSampleData(): Promise<void> {
  try {
    const store = await loadExpenseStore();
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1;

    // Initialize current month if needed
    if (
      !store.currentMonth ||
      store.currentMonth.year !== currentYear ||
      store.currentMonth.month !== currentMonth
    ) {
      store.currentMonth = {
        year: currentYear,
        month: currentMonth,
        days: [],
        monthlyTotal: 0,
        categoryBreakdown: initializeCategoryBreakdown(),
      };
    }

    // Sample expenses for current month (spread across the month)
    const sampleExpenses = [
      // Food expenses
      {
        category: "Food",
        amount: 450,
        description: "Grocery shopping",
        daysAgo: 0,
      },
      {
        category: "Food",
        amount: 120,
        description: "Lunch at restaurant",
        daysAgo: 1,
      },
      {
        category: "Food",
        amount: 85,
        description: "Coffee and snacks",
        daysAgo: 2,
      },
      {
        category: "Food",
        amount: 320,
        description: "Weekly groceries",
        daysAgo: 3,
      },

      // Travel expenses
      { category: "Travel", amount: 250, description: "Uber ride", daysAgo: 0 },
      {
        category: "Travel",
        amount: 180,
        description: "Bus ticket",
        daysAgo: 4,
      },

      // Shopping expenses
      {
        category: "Shopping",
        amount: 1200,
        description: "New clothes",
        daysAgo: 1,
      },
      {
        category: "Shopping",
        amount: 350,
        description: "Electronics",
        daysAgo: 5,
      },

      // Health expenses
      {
        category: "Health",
        amount: 500,
        description: "Doctor visit",
        daysAgo: 2,
      },
      { category: "Health", amount: 150, description: "Medicine", daysAgo: 6 },

      // Entertainment expenses
      {
        category: "Entertainment",
        amount: 200,
        description: "Movie tickets",
        daysAgo: 0,
      },
      {
        category: "Entertainment",
        amount: 80,
        description: "Streaming subscription",
        daysAgo: 3,
      },

      // Accommodation expenses
      {
        category: "Accommodation",
        amount: 800,
        description: "Monthly rent",
        daysAgo: 7,
      },

      // Wellness expenses
      {
        category: "Wellness",
        amount: 300,
        description: "Gym membership",
        daysAgo: 1,
      },
      {
        category: "Wellness",
        amount: 120,
        description: "Spa treatment",
        daysAgo: 4,
      },
    ];

    // Add sample expenses to current month
    sampleExpenses.forEach((expense) => {
      const expenseDate = new Date(today);
      expenseDate.setDate(today.getDate() - expense.daysAgo);
      const dateStr = getDateString(expenseDate);

      let dayData = store.currentMonth!.days.find((d) => d.date === dateStr);
      if (!dayData) {
        dayData = {
          date: dateStr,
          expenses: [],
          totalSpent: 0,
        };
        store.currentMonth!.days.push(dayData);
      }

      dayData.expenses.push({
        id: generateExpenseId(),
        category: expense.category as ExpenseCategory,
        amount: expense.amount,
        description: expense.description,
        timestamp: expenseDate.getTime(),
      });

      dayData.totalSpent = calculateDayTotal(dayData.expenses);
    });

    // Recalculate totals
    store.currentMonth!.monthlyTotal = store.currentMonth!.days.reduce(
      (sum, d) => sum + d.totalSpent,
      0,
    );
    store.currentMonth!.categoryBreakdown = calculateCategoryBreakdown(
      store.currentMonth!.days,
    );

    // Add some archived data for previous month (for yearly testing)
    const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1;
    const prevYear = currentMonth === 1 ? currentYear - 1 : currentYear;

    const archivedMonth: ArchivedMonth = {
      year: prevYear,
      month: prevMonth,
      monthlyTotal: 2500, // Sample total
      weeks: [
        {
          weekNumber: 1,
          startDate: `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`,
          endDate: `${prevYear}-${String(prevMonth).padStart(2, "0")}-07`,
          weeklyTotal: 600,
          categoryBreakdown: {
            Food: 200,
            Travel: 150,
            Shopping: 150,
            Health: 50,
            Entertainment: 30,
            Accommodation: 0,
            Wellness: 20,
          },
        },
        {
          weekNumber: 2,
          startDate: `${prevYear}-${String(prevMonth).padStart(2, "0")}-08`,
          endDate: `${prevYear}-${String(prevMonth).padStart(2, "0")}-14`,
          weeklyTotal: 800,
          categoryBreakdown: {
            Food: 250,
            Travel: 200,
            Shopping: 200,
            Health: 100,
            Entertainment: 40,
            Accommodation: 0,
            Wellness: 10,
          },
        },
        {
          weekNumber: 3,
          startDate: `${prevYear}-${String(prevMonth).padStart(2, "0")}-15`,
          endDate: `${prevYear}-${String(prevMonth).padStart(2, "0")}-21`,
          weeklyTotal: 700,
          categoryBreakdown: {
            Food: 180,
            Travel: 120,
            Shopping: 250,
            Health: 80,
            Entertainment: 50,
            Accommodation: 0,
            Wellness: 20,
          },
        },
        {
          weekNumber: 4,
          startDate: `${prevYear}-${String(prevMonth).padStart(2, "0")}-22`,
          endDate: `${prevYear}-${String(prevMonth).padStart(2, "0")}-28`,
          weeklyTotal: 400,
          categoryBreakdown: {
            Food: 120,
            Travel: 80,
            Shopping: 100,
            Health: 40,
            Entertainment: 30,
            Accommodation: 0,
            Wellness: 30,
          },
        },
      ],
      categoryBreakdown: {
        Food: 750,
        Travel: 550,
        Shopping: 700,
        Health: 270,
        Entertainment: 150,
        Accommodation: 0,
        Wellness: 80,
      },
      archivedDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // 30 days ago
    };

    store.archivedMonths.push(archivedMonth);

    await saveExpenseStore(store);
    console.log("Sample data populated successfully");
  } catch (error) {
    console.error("Error populating sample data:", error);
    throw error;
  }
}
