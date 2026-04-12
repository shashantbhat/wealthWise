/**
 * COMPLETE EXAMPLE: Home Dashboard with Expense Storage
 * This shows how to use the expense storage system in a real component
 */

import { ExpenseCategory } from "@/app/utils/expenseStorage";
import PrimarySvgExpenseChart from "@/components/primary-expense-chart";
import { useExpenses } from "@/context/expense-context";
import { useState } from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

// Example category data
const EXPENSE_CATEGORIES: {
  name: ExpenseCategory;
  icon: string;
  color: string;
}[] = [
  { name: "Food", icon: "🍔", color: "#FF6B6B" },
  { name: "Travel", icon: "🚗", color: "#4ECDC4" },
  { name: "Shopping", icon: "🛍️", color: "#FFE66D" },
  { name: "Health", icon: "🏥", color: "#95E1D3" },
  { name: "Entertainment", icon: "🎬", color: "#C7CEEA" },
  { name: "Accommodation", icon: "🏠", color: "#FF9F43" },
  { name: "Wellness", icon: "💆", color: "#A8E6CF" },
];

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (
    category: ExpenseCategory,
    amount: number,
    description?: string,
  ) => Promise<void>;
  loading?: boolean;
}

function AddExpenseModal({
  visible,
  onClose,
  onAdd,
  loading,
}: AddExpenseModalProps) {
  const [selectedCategory, setSelectedCategory] =
    useState<ExpenseCategory>("Food");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  async function handleAdd() {
    if (!amount || parseFloat(amount) <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    try {
      await onAdd(selectedCategory, parseFloat(amount), description);
      setAmount("");
      setDescription("");
      onClose();
    } catch (error) {
      alert("Failed to add expense");
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 pb-10">
          <Text className="text-2xl font-bold mb-6">Add Expense</Text>

          {/* Category Selection */}
          <Text className="text-lg font-semibold mb-3">Category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            {EXPENSE_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.name}
                onPress={() => setSelectedCategory(cat.name)}
                className={`mr-3 p-4 rounded-lg items-center justify-center ${
                  selectedCategory === cat.name ? "bg-blue-500" : "bg-gray-200"
                }`}
              >
                <Text className="text-2xl">{cat.icon}</Text>
                <Text className="text-xs mt-2 font-semibold">
                  {selectedCategory === cat.name ? "white" : "black"}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Amount Input */}
          <Text className="text-lg font-semibold mb-2">Amount (₹)</Text>
          <View className="border border-gray-300 rounded-lg px-4 py-3 mb-4 flex-row items-center">
            <Text className="text-lg font-semibold">₹</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter amount"
              keyboardType="decimal-pad"
              className="flex-1 ml-2"
            />
          </View>

          {/* Description Input */}
          <Text className="text-lg font-semibold mb-2">
            Description (Optional)
          </Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What did you buy?"
            className="border border-gray-300 rounded-lg px-4 py-3 mb-6"
            multiline
          />

          {/* Action Buttons */}
          <View className="flex-row gap-3">
            <TouchableOpacity
              onPress={onClose}
              className="flex-1 bg-gray-200 rounded-lg py-3"
            >
              <Text className="text-center font-semibold">Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleAdd}
              disabled={loading}
              className="flex-1 bg-blue-500 rounded-lg py-3"
            >
              <Text className="text-center font-semibold text-white">
                {loading ? "Adding..." : "Add Expense"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/**
 * Main Home Dashboard Component
 * Demonstrates all expense storage features
 */
export default function HomeScreen() {
  const {
    monthlyTotal,
    todayTotal,
    currentMonth,
    todayExpenses,
    loading,
    error,
    addExpense,
    deleteExpense,
    refreshData,
  } = useExpenses();

  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Get monthly income (from user profile/context)
  const monthlyIncome = 50000; // Example, replace with actual from user context

  // Calculate budget percentage
  const budgetPercentage =
    monthlyIncome > 0 ? (monthlyTotal / monthlyIncome) * 100 : 0;
  const budgetRemaining = monthlyIncome - monthlyTotal;

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-6 pt-6 pb-4">
        <Text className="text-3xl font-bold">wealthWise</Text>
        <Text className="text-gray-600 mt-2">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View className="mx-6 bg-red-100 border border-red-400 rounded-lg p-4 mb-4">
          <Text className="text-red-800 font-semibold">{error}</Text>
        </View>
      )}

      {/* Monthly Summary Card */}
      <View className="mx-6 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 mb-6 text-white">
        <Text className="text-white text-opacity-90 mb-2">
          Monthly Spending
        </Text>
        <Text className="text-4xl font-bold text-white mb-4">
          ₹{monthlyTotal.toFixed(0)}
        </Text>

        {/* Budget Progress */}
        <View className="bg-white bg-opacity-30 rounded-full h-2 mb-2 overflow-hidden">
          <View
            className="bg-white h-full"
            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}
          />
        </View>
        <Text className="text-white text-sm">
          {budgetPercentage.toFixed(1)}% of ₹{monthlyIncome} budget
        </Text>
        <Text className="text-white text-sm mt-1">
          ₹{budgetRemaining.toFixed(0)} remaining
        </Text>
      </View>

      {/* Category Breakdown */}
      {currentMonth &&
        Object.values(currentMonth.categoryBreakdown).some((v) => v > 0) && (
          <View className="mx-6 mb-6">
            <Text className="text-xl font-bold mb-4">Spending by Category</Text>
            <PrimarySvgExpenseChart
              categories={currentMonth.categoryBreakdown}
              total={monthlyTotal}
            />

            {/* Category List */}
            <View className="mt-4">
              {EXPENSE_CATEGORIES.map((cat) => {
                const amount = currentMonth.categoryBreakdown[cat.name] || 0;
                if (amount === 0) return null;

                return (
                  <View
                    key={cat.name}
                    className="flex-row items-center justify-between py-2 border-b border-gray-200"
                  >
                    <View className="flex-row items-center flex-1">
                      <Text className="text-2xl mr-3">{cat.icon}</Text>
                      <View className="flex-1">
                        <Text className="font-semibold">{cat.name}</Text>
                        <View
                          className="h-1 rounded-full mt-1 bg-gray-200 mr-2"
                          style={{
                            width: (amount / monthlyTotal) * 200,
                            backgroundColor: cat.color,
                          }}
                        />
                      </View>
                    </View>
                    <Text className="font-bold text-lg">
                      ₹{amount.toFixed(0)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

      {/* Today's Expenses */}
      <View className="mx-6 mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-xl font-bold">Today's Expenses</Text>
          <Text className="text-lg font-semibold text-blue-600">
            ₹{todayTotal.toFixed(0)}
          </Text>
        </View>

        {todayExpenses && todayExpenses.expenses.length > 0 ? (
          <View className="bg-gray-50 rounded-lg overflow-hidden">
            {todayExpenses.expenses.map((expense) => (
              <View
                key={expense.id}
                className="flex-row justify-between items-center px-4 py-3 border-b border-gray-200 last:border-b-0"
              >
                <View className="flex-1">
                  <Text className="font-semibold">{expense.category}</Text>
                  {expense.description && (
                    <Text className="text-gray-600 text-sm">
                      {expense.description}
                    </Text>
                  )}
                </View>
                <View className="flex-row items-center gap-3">
                  <Text className="font-bold">
                    ₹{expense.amount.toFixed(0)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteExpense(expense.id)}
                    className="p-2"
                  >
                    <Text className="text-red-500 text-lg">×</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text className="text-gray-500 text-center py-4">
            No expenses today
          </Text>
        )}
      </View>

      {/* Daily Breakdown for Month */}
      {currentMonth && currentMonth.days.length > 0 && (
        <View className="mx-6 mb-6">
          <Text className="text-xl font-bold mb-4">Daily Breakdown</Text>
          {currentMonth.days.map((day) => (
            <View key={day.date} className="mb-2">
              <TouchableOpacity
                onPress={() =>
                  setExpandedDay(expandedDay === day.date ? null : day.date)
                }
                className="flex-row justify-between items-center bg-gray-50 p-4 rounded-lg"
              >
                <View>
                  <Text className="font-semibold">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {day.expenses.length} expense
                    {day.expenses.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Text className="font-bold">₹{day.totalSpent.toFixed(0)}</Text>
              </TouchableOpacity>

              {/* Expanded Day View */}
              {expandedDay === day.date && (
                <View className="bg-gray-100 p-4 mt-2 rounded-lg border border-gray-200">
                  {day.expenses.map((expense) => (
                    <View
                      key={expense.id}
                      className="flex-row justify-between items-center mb-2 pb-2 border-b border-gray-300 last:border-b-0"
                    >
                      <View className="flex-1">
                        <Text className="font-semibold">
                          {expense.category}
                        </Text>
                        {expense.description && (
                          <Text className="text-gray-600 text-xs">
                            {expense.description}
                          </Text>
                        )}
                      </View>
                      <Text className="font-semibold">₹{expense.amount}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Add Expense Button */}
      <TouchableOpacity
        onPress={() => setShowAddModal(true)}
        className="mx-6 mb-6 bg-blue-500 rounded-lg py-4"
      >
        <Text className="text-white text-center font-semibold text-lg">
          + Add Expense
        </Text>
      </TouchableOpacity>

      {/* Refresh Button */}
      <TouchableOpacity
        onPress={refreshData}
        disabled={loading}
        className="mx-6 mb-12 bg-gray-200 rounded-lg py-3"
      >
        <Text className="text-center font-semibold">
          {loading ? "Loading..." : "Refresh Data"}
        </Text>
      </TouchableOpacity>

      {/* Add Expense Modal */}
      <AddExpenseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={addExpense}
        loading={loading}
      />
    </ScrollView>
  );
}

// Note: Don't forget to import TextInput from react-native
import { TextInput } from "react-native";
