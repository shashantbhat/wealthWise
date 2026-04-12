/\*\*

- EXPENSE STORAGE SYSTEM - USAGE GUIDE
- ═══════════════════════════════════════════════════════════════════════════════
-
- This guide explains how to use the expense storage system throughout your app.
-
- ARCHITECTURE OVERVIEW:
- ──────────────────────
-
- 1.  expenseStorage.ts
- - Low-level storage operations
- - Direct AsyncStorage interaction
- - Data aggregation logic (daily → weekly → monthly)
- - Functions for adding, deleting, retrieving expenses
-
- 2.  expense-context.tsx
- - React Context wrapper around expenseStorage
- - Global state management
- - Automatic data refresh
- - Error handling
- - Use via useExpenses() hook
-
- 3.  Components
- - Use useExpenses() hook to access and modify data
- - No direct AsyncStorage calls needed
-
- ═══════════════════════════════════════════════════════════════════════════════
  \*/

// ─── SETUP: Add ExpenseProvider to Your App ────────────────────────────────────
//
// In your root app layout (\_layout.tsx or app.tsx):
//
// import { ExpenseProvider } from '@/context/expense-context';
//
// export default function RootLayout() {
// return (
// <ExpenseProvider>
// <Stack>
// {/_ Your app structure _/}
// </Stack>
// </ExpenseProvider>
// );
// }

// ─── USAGE 1: Add an Expense ────────────────────────────────────────────────────

import { useExpenses } from '@/context/expense-context';

function AddExpenseExample() {
const { addExpense, loading, error } = useExpenses();

async function handleAddExpense() {
try {
await addExpense('Food', 450, 'Lunch at restaurant');
// Data automatically updated in context
console.log('Expense added successfully!');
} catch (err) {
console.error('Failed to add expense:', err);
}
}

return (
<button onPress={handleAddExpense} disabled={loading}>
{loading ? 'Adding...' : 'Add Expense'}
{error && <Text style={{ color: 'red' }}>{error}</Text>}
</button>
);
}

// ─── USAGE 2: Display Current Month Total ──────────────────────────────────────

function MonthlyTotalWidget() {
const { monthlyTotal, currentMonth } = useExpenses();

if (!currentMonth) {
return <Text>No expenses this month</Text>;
}

return (
<View>
<Text style={{ fontSize: 24, fontWeight: 'bold' }}>
₹{monthlyTotal.toFixed(2)}
</Text>
<Text>Expenses this month</Text>
</View>
);
}

// ─── USAGE 3: Display Category Breakdown ───────────────────────────────────────

function CategoryBreakdownExample() {
const { currentMonth } = useExpenses();

if (!currentMonth) {
return <Text>No data</Text>;
}

return (
<View>
{Object.entries(currentMonth.categoryBreakdown).map(([category, amount]) => (
<View key={category}>
<Text>{category}</Text>
<Text>₹{amount.toFixed(2)}</Text>
</View>
))}
</View>
);
}

// ─── USAGE 4: Display Today's Expenses ─────────────────────────────────────────

function TodayExpensesExample() {
const { todayExpenses, todayTotal } = useExpenses();

if (!todayExpenses) {
return <Text>No expenses today</Text>;
}

return (
<View>
<Text>Today's Expenses: ₹{todayTotal.toFixed(2)}</Text>
{todayExpenses.expenses.map((expense) => (
<View key={expense.id}>
<Text>{expense.category}</Text>
<Text>₹{expense.amount}</Text>
{expense.description && <Text>{expense.description}</Text>}
</View>
))}
</View>
);
}

// ─── USAGE 5: Display All Days with Expenses ───────────────────────────────────

function AllDaysBreakdownExample() {
const { currentMonth } = useExpenses();

if (!currentMonth || currentMonth.days.length === 0) {
return <Text>No expenses recorded</Text>;
}

return (
<View>
{currentMonth.days.map((day) => (
<View key={day.date}>
<Text style={{ fontWeight: 'bold' }}>{day.date}</Text>
<Text>Daily Total: ₹{day.totalSpent.toFixed(2)}</Text>
{day.expenses.map((expense) => (
<View key={expense.id}>
<Text> • {expense.category}: ₹{expense.amount}</Text>
</View>
))}
</View>
))}
</View>
);
}

// ─── USAGE 6: Delete an Expense ────────────────────────────────────────────────

function DeleteExpenseExample() {
const { deleteExpense, loading } = useExpenses();

async function handleDelete(expenseId: string) {
try {
await deleteExpense(expenseId);
console.log('Expense deleted');
} catch (err) {
console.error('Failed to delete:', err);
}
}

return (
<button onPress={() => handleDelete('some-id')} disabled={loading}>
Delete Expense
</button>
);
}

// ─── USAGE 7: Archive Current Month (Month-End) ────────────────────────────────

function ArchiveMonthExample() {
const { archiveMonth, loading, currentMonth } = useExpenses();

async function handleArchive() {
try {
if (window.confirm('Archive this month? Detailed daily data will be aggregated into weeks.')) {
await archiveMonth();
console.log('Month archived successfully');
}
} catch (err) {
console.error('Failed to archive:', err);
}
}

return (
<button onPress={handleArchive} disabled={!currentMonth || loading}>
Archive Month
</button>
);
}

// ─── USAGE 8: Access Detailed Storage Functions Directly ──────────────────────

// For advanced use cases, you can also use storage functions directly:

import {
getAllArchivedMonths,
getArchivedMonth,
exportAllDataAsJSON,
} from '@/app/utils/expenseStorage';

async function ExportAllDataExample() {
try {
const jsonData = await exportAllDataAsJSON();
console.log('Exported:', jsonData);
// Save to file, send to server, etc.
} catch (err) {
console.error('Export failed:', err);
}
}

async function ViewHistoryExample() {
try {
const allMonths = await getAllArchivedMonths();
console.log('Historical months:');
allMonths.forEach((month) => {
console.log(`${month.year}-${month.month}: ₹${month.monthlyTotal}`);
month.weeks.forEach((week) => {
console.log(`  Week ${week.weekNumber}: ₹${week.weeklyTotal}`);
});
});
} catch (err) {
console.error('Failed to load history:', err);
}
}

async function GetSpecificMonthExample() {
try {
const march2026 = await getArchivedMonth(2026, 3);
if (march2026) {
console.log(`March 2026 total: ₹${march2026.monthlyTotal}`);
}
} catch (err) {
console.error('Failed to load month:', err);
}
}

// ═══════════════════════════════════════════════════════════════════════════════
//
// DATA STRUCTURE SUMMARY
// ════════════════════════════════════════════════════════════════════════════════
//
// WHILE MONTH IS ACTIVE (In Memory):
// ──────────────────────────────────
//
// MonthlyData {
// year: 2026,
// month: 4,
// monthlyTotal: 5000,
// categoryBreakdown: {
// Food: 1500,
// Travel: 2000,
// Shopping: 1500,
// Health: 0,
// Entertainment: 0,
// Accommodation: 0,
// Wellness: 0
// },
// days: [
// {
// date: "2026-04-01",
// totalSpent: 850,
// expenses: [
// {
// id: "1712000000000-abc123",
// category: "Food",
// amount: 500,
// description: "Breakfast",
// timestamp: 1712000000000
// },
// {
// id: "1712100000000-def456",
// category: "Travel",
// amount: 350,
// description: "Auto ride",
// timestamp: 1712100000000
// }
// ]
// },
// {
// date: "2026-04-02",
// totalSpent: 400,
// expenses: [...]
// }
// ]
// }
//
//
// AFTER MONTH ENDS (Aggregated):
// ─────────────────────────────
//
// ArchivedMonth {
// year: 2026,
// month: 3,
// monthlyTotal: 5000,
// archivedDate: 1712352000000,
// categoryBreakdown: {...},
// weeks: [
// {
// weekNumber: 10,
// startDate: "2026-03-02",
// endDate: "2026-03-08",
// weeklyTotal: 1200,
// categoryBreakdown: {...}
// },
// {
// weekNumber: 11,
// startDate: "2026-03-09",
// endDate: "2026-03-15",
// weeklyTotal: 1800,
// categoryBreakdown: {...}
// }
// ]
// }
//
// ═══════════════════════════════════════════════════════════════════════════════
//
// WORKFLOW
// ════════
//
// 1. USER ADDS EXPENSE
// ├─ Call: addExpense('Food', 500, 'Lunch')
// ├─ Action: Creates DailyExpense, adds to today's DayData
// ├─ Storage: Saves to AsyncStorage (currentMonth.days)
// └─ UI Updates: Context notifies all subscribed components
//
// 2. USER VIEWS DAILY EXPENSES
// ├─ Call: getTodayExpenses() or use context's todayExpenses
// ├─ Action: Retrieves today's DayData
// └─ UI: Displays all expenses from today
//
// 3. USER VIEWS MONTHLY SUMMARY
// ├─ Call: getCurrentMonthExpenses() or use context's currentMonth
// ├─ Action: Gets full MonthlyData with all days and breakdown
// └─ UI: Shows donut chart, category breakdown, daily list
//
// 4. USER DELETES EXPENSE
// ├─ Call: deleteExpense(expenseId)
// ├─ Action: Removes from day, recalculates totals
// ├─ Storage: Updates AsyncStorage
// └─ UI Updates: Context triggers refresh
//
// 5. MONTH ENDS (Automatic or Manual)
// ├─ Call: archiveCurrentMonth()
// ├─ Step 1: Iterate through all days
// ├─ Step 2: Group days into weeks (by ISO week number)
// ├─ Step 3: Aggregate daily data into weekly summaries
// ├─ Step 4: Create ArchivedMonth object
// ├─ Step 5: Delete detailed daily data
// ├─ Storage: Save to archivedMonths array
// └─ Result: Month now shows only weekly aggregates, not daily details
//
// 6. USER VIEWS HISTORICAL DATA
// ├─ Call: getArchivedMonth(2026, 3) or getAllArchivedMonths()
// ├─ Action: Retrieves aggregated week-level data
// ├─ UI: Shows last year's March broken down by weeks
// └─ Note: Daily details are discarded after archiving
//
// ═══════════════════════════════════════════════════════════════════════════════

export {};
