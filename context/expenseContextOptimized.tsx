import {
    archiveCurrentMonth,
    clearCache,
    DayData,
    ExpenseCategory,
    getCurrentMonthExpenses,
    getTodayExpenses,
    MonthlyData,
    addExpense as storageAddExpense,
    deleteExpense as storageDeleteExpense,
} from "@/app/utils/expenseStorageOptimized";
import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from "react";

export type { ExpenseCategory };

// ─── Types ────────────────────────────────────────────────────────────────────

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

  // Computed (memoized)
  monthlyTotal: number;
  todayTotal: number;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const ExpenseContext = createContext<ExpenseContextType | undefined>(undefined);

// ─── Provider ──────────────────────────────────────────────────────────────────

interface ExpenseProviderProps {
  children: React.ReactNode;
}

export function ExpenseProvider({ children }: ExpenseProviderProps) {
  const [currentMonth, setCurrentMonth] = useState<MonthlyData | null>(null);
  const [todayExpenses, setTodayExpenses] = useState<DayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track pending operations to prevent duplicate requests
  const pendingOpsRef = useRef(0);

  // Load initial data on mount
  useEffect(() => {
    refreshData();
  }, []);

  // Refresh data from storage
  const refreshData = useCallback(async () => {
    // Prevent overlapping refresh calls
    if (pendingOpsRef.current > 0) {
      return;
    }

    try {
      pendingOpsRef.current++;
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
      pendingOpsRef.current--;
      setLoading(false);
    }
  }, []);

  // Add expense with optimistic update
  const addExpense = useCallback(
    async (category: ExpenseCategory, amount: number, description?: string) => {
      if (pendingOpsRef.current > 0) {
        throw new Error("Operation in progress");
      }

      try {
        pendingOpsRef.current++;
        setError(null);

        // Perform storage operation
        await storageAddExpense(category, amount, description);

        // Refresh data in background (optimistic update already done by caller)
        await refreshData();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error adding expense";
        setError(message);
        throw err;
      } finally {
        pendingOpsRef.current--;
      }
    },
    [refreshData],
  );

  // Delete expense with optimistic update
  const deleteExpense = useCallback(
    async (expenseId: string) => {
      if (pendingOpsRef.current > 0) {
        throw new Error("Operation in progress");
      }

      try {
        pendingOpsRef.current++;
        setError(null);

        await storageDeleteExpense(expenseId);
        await refreshData();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Error deleting expense";
        setError(message);
        throw err;
      } finally {
        pendingOpsRef.current--;
      }
    },
    [refreshData],
  );

  // Archive month
  const archiveMonth = useCallback(async () => {
    if (pendingOpsRef.current > 0) {
      throw new Error("Operation in progress");
    }

    try {
      pendingOpsRef.current++;
      setError(null);

      await archiveCurrentMonth();
      clearCache();
      await refreshData();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Error archiving month";
      setError(message);
      throw err;
    } finally {
      pendingOpsRef.current--;
    }
  }, [refreshData]);

  // Memoized computed values to prevent unnecessary re-renders
  const monthlyTotal = useMemo(
    () => currentMonth?.monthlyTotal ?? 0,
    [currentMonth],
  );
  const todayTotal = useMemo(
    () => todayExpenses?.totalSpent ?? 0,
    [todayExpenses],
  );

  // Memoize context value to prevent unnecessary re-renders of consumers
  const value = useMemo<ExpenseContextType>(
    () => ({
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
    }),
    [
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
    ],
  );

  return (
    <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────

export function useExpenses(): ExpenseContextType {
  const context = useContext(ExpenseContext);
  if (context === undefined) {
    throw new Error("useExpenses must be used within ExpenseProvider");
  }
  return context;
}
