import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export interface InvestmentOption {
  name: string;
  expectedReturn: number; // annual return percentage
  risk: "Low" | "Medium" | "High";
  monthlySIP?: number; // calculated SIP amount
}

export interface HistoryEntry {
  year: number;
  portfolioValue: number;
  extraAdded: number;
  actualReturn: number; // actual annual return
  notes?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  timeHorizon: number; // in years
  currentCorpus: number; // initial investment
  monthlySIP: number;
  expectedReturn: number; // expected annual return
  investmentOptions: InvestmentOption[];
  history: HistoryEntry[];
  createdAt: string; // ISO string
}

export interface BudgetsStore {
  budgets: Record<string, number>;
  lastUpdated: number;
}

export interface GoalsStore {
  goals: Goal[];
  lastUpdated: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const BUDGETS_STORAGE_KEY = "wealthwise_budgets";
const GOALS_STORAGE_KEY = "wealthwise_goals";

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

const DEFAULT_BUDGETS_STORE: BudgetsStore = {
  budgets: DEFAULT_BUDGETS,
  lastUpdated: Date.now(),
};

const DEFAULT_GOALS_STORE: GoalsStore = {
  goals: [],
  lastUpdated: Date.now(),
};

// ─── In-Memory Cache ──────────────────────────────────────────────────────────

let cachedBudgets: BudgetsStore | null = null;
let budgetsCacheExpiry = 0;

let cachedGoals: GoalsStore | null = null;
let goalsCacheExpiry = 0;

const CACHE_DURATION = 5000; // 5 seconds

function isBudgetsCacheValid(): boolean {
  return (
    cachedBudgets !== null &&
    Date.now() - budgetsCacheExpiry < CACHE_DURATION
  );
}

function isGoalsCacheValid(): boolean {
  return (
    cachedGoals !== null && Date.now() - goalsCacheExpiry < CACHE_DURATION
  );
}

function invalidateBudgetsCache(): void {
  cachedBudgets = null;
}

function invalidateGoalsCache(): void {
  cachedGoals = null;
}

// ─── Budgets Storage ──────────────────────────────────────────────────────────

/**
 * Load budgets with caching
 */
export async function loadBudgets(): Promise<Record<string, number>> {
  if (isBudgetsCacheValid() && cachedBudgets) {
    return cachedBudgets.budgets;
  }

  try {
    const stored = await AsyncStorage.getItem(BUDGETS_STORAGE_KEY);
    const store = stored
      ? (JSON.parse(stored) as BudgetsStore)
      : DEFAULT_BUDGETS_STORE;

    cachedBudgets = store;
    budgetsCacheExpiry = Date.now();
    return store.budgets;
  } catch (error) {
    console.error("Error loading budgets:", error);
    return DEFAULT_BUDGETS;
  }
}

/**
 * Save budgets to AsyncStorage
 */
export async function saveBudgets(budgets: Record<string, number>): Promise<void> {
  try {
    const store: BudgetsStore = {
      budgets,
      lastUpdated: Date.now(),
    };
    await AsyncStorage.setItem(BUDGETS_STORAGE_KEY, JSON.stringify(store));
    cachedBudgets = store;
    budgetsCacheExpiry = Date.now();
  } catch (error) {
    console.error("Error saving budgets:", error);
    throw error;
  }
}

/**
 * Update a single budget category
 */
export async function updateBudget(
  category: string,
  amount: number,
): Promise<void> {
  const budgets = await loadBudgets();
  budgets[category] = amount;
  await saveBudgets(budgets);
}

// ─── Goals Storage ────────────────────────────────────────────────────────────

/**
 * Load goals with caching
 */
export async function loadGoals(): Promise<Goal[]> {
  if (isGoalsCacheValid() && cachedGoals) {
    return cachedGoals.goals;
  }

  try {
    const stored = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
    const store = stored
      ? (JSON.parse(stored) as GoalsStore)
      : DEFAULT_GOALS_STORE;

    cachedGoals = store;
    goalsCacheExpiry = Date.now();
    return store.goals;
  } catch (error) {
    console.error("Error loading goals:", error);
    return [];
  }
}

/**
 * Save goals to AsyncStorage
 */
export async function saveGoals(goals: Goal[]): Promise<void> {
  try {
    const store: GoalsStore = {
      goals,
      lastUpdated: Date.now(),
    };
    await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(store));
    cachedGoals = store;
    goalsCacheExpiry = Date.now();
  } catch (error) {
    console.error("Error saving goals:", error);
    throw error;
  }
}

/**
 * Add a new goal
 */
export async function addGoal(goal: Goal): Promise<void> {
  const goals = await loadGoals();
  goals.push(goal);
  await saveGoals(goals);
}

/**
 * Update an existing goal
 */
export async function updateGoal(goal: Goal): Promise<void> {
  const goals = await loadGoals();
  const index = goals.findIndex((g) => g.id === goal.id);
  if (index !== -1) {
    goals[index] = goal;
    await saveGoals(goals);
  }
}

/**
 * Delete a goal
 */
export async function deleteGoal(goalId: string): Promise<void> {
  const goals = await loadGoals();
  const filtered = goals.filter((g) => g.id !== goalId);
  await saveGoals(filtered);
}

/**
 * Clear all data (for testing/reset)
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([BUDGETS_STORAGE_KEY, GOALS_STORAGE_KEY]);
    invalidateBudgetsCache();
    invalidateGoalsCache();
  } catch (error) {
    console.error("Error clearing data:", error);
    throw error;
  }
}
