import {
    archiveCurrentMonth,
    DayData,
    ExpenseCategory,
    getCurrentMonthExpenses,
    getTodayExpenses,
    MonthlyData,
    addExpense as storageAddExpense,
    deleteExpense as storageDeleteExpense,
} from "@/app/utils/expenseStorage";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from "react";

// Re-export ExpenseCategory for convenience
export type { ExpenseCategory };

// ─── Context Type ─────────────────────────────────────────────────────────────

interface ExpenseContextType {
  // State
  currentMonth: MonthlyData | null;
  todayExpenses: DayData | null;
  loading: boolean;
  error: string | null;

  // Actions
  addExpense: (
    category: ExpenseCategory,
    amount: number,
    description?: string,
  ) => Promise<void>;
  deleteExpense: (expenseId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  archiveMonth: () => Promise<void>;

  // Computed
  monthlyTotal: number;
  todayTotal: number;
}

// ─── Create Context ───────────────────────────────────────────────────────────

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

// ─── Provider Component ───────────────────────────────────────────────────────

interface ExpenseProviderProps {
  children: React.ReactNode;
}

export function ExpenseProvider({ children }: ExpenseProviderProps) {
  const [currentMonth, setCurrentMonth] = useState<MonthlyData | null>(null);
  const [todayExpenses, setTodayExpenses] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [month, today] = await Promise.all([
        getCurrentMonthExpenses(),
        getTodayExpenses(),
      ]);

      setCurrentMonth(month);
      setTodayExpenses(today);
    } catch (err) {
      console.error("Error refreshing expense data:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  const addExpense = useCallback(
    async (category: ExpenseCategory, amount: number, description?: string) => {
      try {
        setError(null);
        await storageAddExpense(category, amount, description);
        await refreshData();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error adding expense";
        setError(message);
        throw err;
      }
    },
    [refreshData],
  );

  const deleteExpense = useCallback(
    async (expenseId: string) => {
      try {
        setError(null);
        await storageDeleteExpense(expenseId);
        await refreshData();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error deleting expense";
        setError(message);
        throw err;
      }
    },
    [refreshData],
  );

  const archiveMonth = useCallback(async () => {
    try {
      setError(null);
      await archiveCurrentMonth();
      await refreshData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error archiving month";
      setError(message);
      throw err;
    }
  }, [refreshData]);

  // Computed values
  const monthlyTotal = currentMonth?.monthlyTotal ?? 0;
  const todayTotal = todayExpenses?.totalSpent ?? 0;

  const value: ExpenseContextType = {
    currentMonth,
    todayExpenses,
    loading,
    error,
    addExpense,
    deleteExpense,
    refreshData,
    archiveMonth,
    monthlyTotal,
    todayTotal,
  };

  return (
    <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
  );
}

// ─── Custom Hook ──────────────────────────────────────────────────────────────

export function useExpenses(): ExpenseContextType {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error("useExpenses must be used within ExpenseProvider");
  }
  return context;
}
