import {
    calculateCategoryTrends,
    calculateMonthEndForecast,
    calculateSavingsMetrics,
    CategoryTrend,
    generateSmartNudges,
    MonthEndForecast,
    SavingsMetrics,
    SmartNudge,
} from "@/app/utils/analyticsCalculator";
import {
    ArchivedMonth,
    getAllArchivedMonths,
} from "@/app/utils/expenseStorageOptimized";
import { useExpenses } from "@/context/expenseContextOptimized";
import { useUser } from "@/context/user-context";
import { useEffect, useState } from "react";
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

export default function AnalyticsScreen() {
  const { currentMonth, loading: contextLoading } = useExpenses();
  const { monthlyIncome, salaryDay = 1 } = useUser();
  const [archivedMonths, setArchivedMonths] = useState<ArchivedMonth[]>([]);
  const [loading, setLoading] = useState(true);

  // Analytics data
  const [categoryTrends, setCategoryTrends] = useState<CategoryTrend[]>([]);
  const [savingsMetrics, setSavingsMetrics] = useState<SavingsMetrics | null>(
    null,
  );
  const [forecast, setForecast] = useState<MonthEndForecast | null>(null);
  const [nudges, setNudges] = useState<SmartNudge[]>([]);

  // Load archived months
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const archived = await getAllArchivedMonths();
        setArchivedMonths(archived);
      } catch (error) {
        console.error("Error loading archived months:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentMonth]);

  // Calculate analytics for current month
  useEffect(() => {
    if (!monthlyIncome || !currentMonth) {
      setCategoryTrends([]);
      setSavingsMetrics(null);
      setForecast(null);
      setNudges([]);
      return;
    }

    // Get previous month for trend comparison
    const previousMonth = archivedMonths.length > 0 ? archivedMonths[0] : null;

    // Calculate trends
    const trends = calculateCategoryTrends(
      currentMonth,
      previousMonth || undefined,
    );
    setCategoryTrends(trends);

    // Calculate savings metrics (using 20% target if not set)
    const targetSavingsRate = 20;
    const savings = calculateSavingsMetrics(
      monthlyIncome,
      currentMonth.monthlyTotal,
      targetSavingsRate,
    );
    setSavingsMetrics(savings);

    // Calculate month-end forecast
    const now = new Date();
    const daysElapsed = now.getDate();
    const forecastData = calculateMonthEndForecast(
      monthlyIncome,
      currentMonth.monthlyTotal,
      daysElapsed,
    );
    setForecast(forecastData);

    // Generate smart nudges
    const smartNudges = generateSmartNudges(
      savings,
      forecastData,
      trends,
      salaryDay,
    );
    setNudges(smartNudges);
  }, [currentMonth, monthlyIncome, archivedMonths, salaryDay]);

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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
        </View>

        {/* Smart Nudges Section */}
        {nudges.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>💡 Smart Tips</Text>
            {nudges.map((nudge, idx) => {
              const bgColor =
                nudge.type === "warning"
                  ? "#FFE5E5"
                  : nudge.type === "achievement"
                    ? "#E5F8F5"
                    : nudge.type === "forecast"
                      ? "#E8F0FF"
                      : "#FFF8E5";
              const borderColor =
                nudge.type === "warning"
                  ? "#FF6B6B"
                  : nudge.type === "achievement"
                    ? "#29C983"
                    : nudge.type === "forecast"
                      ? "#4A9EFF"
                      : "#FFD93D";

              return (
                <View
                  key={idx}
                  style={[
                    styles.nudgeCard,
                    { backgroundColor: bgColor, borderColor },
                  ]}
                >
                  <View style={styles.nudgeHeader}>
                    <Text style={styles.nudgeTitle}>{nudge.title}</Text>
                    <View
                      style={[
                        styles.priorityBadge,
                        {
                          backgroundColor: borderColor,
                        },
                      ]}
                    >
                      <Text style={styles.priorityText}>
                        {nudge.priority.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.nudgeMessage}>{nudge.message}</Text>
                  {nudge.actionable && (
                    <TouchableOpacity
                      style={[styles.nudgeAction, { borderColor }]}
                    >
                      <Text
                        style={[styles.nudgeActionText, { color: borderColor }]}
                      >
                        Take Action →
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* Savings Rate Tracker */}
        {savingsMetrics && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📊 Savings Rate Tracker</Text>
            <View style={styles.savingsCard}>
              <View style={styles.savingsRow}>
                <View style={styles.savingsItem}>
                  <Text style={styles.savingsLabel}>Income</Text>
                  <Text style={styles.savingsValue}>
                    ₹{savingsMetrics.income.toFixed(0)}
                  </Text>
                </View>
                <View style={styles.savingsDivider} />
                <View style={styles.savingsItem}>
                  <Text style={styles.savingsLabel}>Expenses</Text>
                  <Text style={styles.savingsValue}>
                    ₹{savingsMetrics.expenses.toFixed(0)}
                  </Text>
                </View>
                <View style={styles.savingsDivider} />
                <View style={styles.savingsItem}>
                  <Text style={styles.savingsLabel}>Savings</Text>
                  <Text
                    style={[
                      styles.savingsValue,
                      {
                        color:
                          savingsMetrics.savingsAmount >= 0
                            ? "#29C983"
                            : "#FF6B6B",
                      },
                    ]}
                  >
                    ₹{savingsMetrics.savingsAmount.toFixed(0)}
                  </Text>
                </View>
              </View>

              <View style={styles.savingsMetricsRow}>
                <View style={styles.savingsMetric}>
                  <Text style={styles.metricLabel}>Your Rate</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      {
                        color: savingsMetrics.meetsTarget
                          ? "#29C983"
                          : "#FF9F43",
                      },
                    ]}
                  >
                    {savingsMetrics.savingsRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.savingsMetric}>
                  <Text style={styles.metricLabel}>Target</Text>
                  <Text style={styles.metricValue}>
                    {savingsMetrics.targetSavingsRate.toFixed(1)}%
                  </Text>
                </View>
                <View style={styles.savingsMetric}>
                  <Text style={styles.metricLabel}>Status</Text>
                  <Text
                    style={[
                      styles.metricValue,
                      {
                        color: savingsMetrics.meetsTarget
                          ? "#29C983"
                          : "#FF6B6B",
                      },
                    ]}
                  >
                    {savingsMetrics.meetsTarget ? "✓ On Track" : "✗ Below"}
                  </Text>
                </View>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min(savingsMetrics.savingsRate, 100)}%`,
                      backgroundColor: savingsMetrics.meetsTarget
                        ? "#29C983"
                        : "#FF9F43",
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Month-End Forecast */}
        {forecast && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>🔮 Month-End Forecast</Text>
            <View style={styles.forecastCard}>
              <View style={styles.forecastRow}>
                <View style={styles.forecastItem}>
                  <Text style={styles.forecastLabel}>Current Pace</Text>
                  <Text style={styles.forecastValue}>
                    ₹{forecast.currentPace.toFixed(0)}/day
                  </Text>
                </View>
                <View style={styles.forecastDivider} />
                <View style={styles.forecastItem}>
                  <Text style={styles.forecastLabel}>Days Left</Text>
                  <Text style={styles.forecastValue}>
                    {forecast.daysRemaining}
                  </Text>
                </View>
              </View>

              <View style={styles.forecastProjection}>
                <View style={styles.projectionHeader}>
                  <Text style={styles.projectionLabel}>Projected Total</Text>
                  <Text
                    style={[
                      styles.projectionValue,
                      {
                        color: forecast.variance > 0 ? "#FF6B6B" : "#29C983",
                      },
                    ]}
                  >
                    ₹{forecast.projectedTotal.toFixed(0)}
                  </Text>
                </View>
                <Text style={styles.projectionSubtext}>
                  {forecast.variance > 0
                    ? `Over budget by ₹${forecast.variance.toFixed(0)}`
                    : `Under budget by ₹${Math.abs(forecast.variance).toFixed(0)}`}
                </Text>
              </View>

              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${Math.min((forecast.projectedTotal / (monthlyIncome || 50000)) * 100, 100)}%`,
                      backgroundColor:
                        forecast.variance > 0 ? "#FF6B6B" : "#29C983",
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Category Trends */}
        {categoryTrends.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>📈 Category Trends</Text>
            {categoryTrends.map((trend) => {
              if (trend.previousMonth === 0 && trend.currentMonth === 0)
                return null;

              const isUp = trend.trend === "up";
              const trendColor = isUp
                ? "#FF6B6B"
                : trend.trend === "down"
                  ? "#29C983"
                  : "#8E98AD";

              return (
                <View key={trend.category} style={styles.trendItem}>
                  <View style={styles.trendHeader}>
                    <View style={styles.trendInfo}>
                      <Text style={styles.trendCategory}>{trend.category}</Text>
                      <View style={styles.trendValues}>
                        <Text style={styles.trendValue}>
                          {trend.currentMonth > 0
                            ? `₹${trend.currentMonth.toFixed(0)}`
                            : "—"}
                        </Text>
                        {trend.previousMonth > 0 && (
                          <Text style={styles.trendPrevious}>
                            (was ₹{trend.previousMonth.toFixed(0)})
                          </Text>
                        )}
                      </View>
                    </View>
                    <View
                      style={[
                        styles.trendBadge,
                        { backgroundColor: `${trendColor}22` },
                      ]}
                    >
                      <Text
                        style={[
                          styles.trendBadgeText,
                          {
                            color: trendColor,
                          },
                        ]}
                      >
                        {isUp ? "↑" : trend.trend === "down" ? "↓" : "→"}{" "}
                        {Math.abs(trend.changePercent).toFixed(1)}%
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
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
  nudgeCard: {
    borderLeftWidth: 4,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  nudgeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  nudgeTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    flex: 1,
    marginRight: 8,
  },
  priorityBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  priorityText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 11,
  },
  nudgeMessage: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
    marginBottom: 10,
  },
  nudgeAction: {
    borderTopWidth: 1,
    paddingTop: 10,
  },
  nudgeActionText: {
    fontWeight: "600",
    fontSize: 12,
  },
  savingsCard: {
    backgroundColor: "#F8FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  savingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  savingsItem: {
    flex: 1,
    alignItems: "center",
  },
  savingsLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  savingsValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  savingsDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
    height: "100%",
    minHeight: 50,
  },
  savingsMetricsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  savingsMetric: {
    flex: 1,
    alignItems: "center",
  },
  metricLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  forecastCard: {
    backgroundColor: "#F8FAFB",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  forecastRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  forecastItem: {
    flex: 1,
    alignItems: "center",
  },
  forecastLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "600",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  forecastValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  forecastDivider: {
    width: 1,
    backgroundColor: "#E5E7EB",
    marginHorizontal: 8,
    height: "100%",
    minHeight: 50,
  },
  forecastProjection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  projectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  projectionLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "600",
  },
  projectionValue: {
    fontSize: 16,
    fontWeight: "700",
  },
  projectionSubtext: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  trendItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  trendHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  trendInfo: {
    flex: 1,
  },
  trendCategory: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 4,
  },
  trendValues: {
    flexDirection: "row",
    alignItems: "center",
  },
  trendValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  trendPrevious: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 8,
  },
  trendBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  trendBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },
});
