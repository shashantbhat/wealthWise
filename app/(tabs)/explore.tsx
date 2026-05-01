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
import { CATEGORY_ICONS, formatINR } from "@/app/utils/constants";
import {
    ArchivedMonth,
    getAllArchivedMonths,
} from "@/app/utils/expenseStorageOptimized";
import { Fonts, Typography } from "@/constants/theme";
import { useExpenses } from "@/context/expenseContextOptimized";
import { useUser } from "@/context/user-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Dimensions,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

const ANALYTICS_THEME = {
  background: "#FFFFFF",
  surface: "#F7F7F8",
  surfaceStrong: "#EEEEF0",
  border: "#D7D9DE",
  text: "#111111",
  muted: "#666666",
  accent: "#111111",
  teal: "#8E8E8E",
  violet: "#A8A8A8",
  pink: "#757575",
  amber: "#B5B5B5",
  red: "#9E9E9E",
  green: "#D0D0D0",
};

const CHART_WIDTH = Dimensions.get("window").width - 88;

function formatMonthLabel(month: number, year: number): string {
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${monthNames[month - 1]} ${year}`;
}

function formatCompactINR(amount: number): string {
  if (!Number.isFinite(amount)) {
    return "₹0";
  }

  const absolute = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (absolute >= 1e7) {
    return `${sign}₹${(absolute / 1e7).toFixed(1)}Cr`;
  }

  if (absolute >= 1e5) {
    return `${sign}₹${(absolute / 1e5).toFixed(1)}L`;
  }

  if (absolute >= 1e3) {
    return `${sign}₹${(absolute / 1e3).toFixed(1)}K`;
  }

  return `${sign}₹${Math.round(absolute).toLocaleString("en-IN")}`;
}

function buildSparklinePath(values: number[], width: number, height: number) {
  if (values.length === 0) {
    const flat = height / 2;
    return {
      linePath: `M0 ${flat} L${width} ${flat}`,
      areaPath: `M0 ${height} L0 ${flat} L${width} ${flat} L${width} ${height} Z`,
    };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = Math.max(1, max - min);
  const stepX = values.length > 1 ? width / (values.length - 1) : width;

  const points = values.map((value, index) => ({
    x: index * stepX,
    y: height - ((value - min) / range) * height,
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`)
    .join(" ");
  const first = points[0];
  const last = points[points.length - 1];

  return {
    linePath,
    areaPath: `M${first.x} ${height} ${linePath.replaceAll("M", "L")} L${last.x} ${height} Z`,
  };
}

function getCategoryAccent(category: string) {
  const accents: Record<string, string> = {
    Food: "#D1D1D1",
    Travel: "#BDBDBD",
    Shopping: "#A8A8A8",
    Health: "#E0E0E0",
    Entertainment: "#C2C2C2",
    Accommodation: "#D8D8D8",
    Wellness: "#F0F0F0",
  };

  return accents[category] ?? ANALYTICS_THEME.accent;
}

function getCategoryHistory(trend: CategoryTrend) {
  const values = [trend.previousMonth, trend.currentMonth].map((value) =>
    Math.max(0, value),
  );
  const hasMovement = values.some((value) => value > 0);
  return hasMovement ? values : [0, 1];
}

function MetricPill({
  icon,
  label,
  value,
  tone,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <View style={styles.metricPill}>
      <View style={[styles.metricIconWrap, { backgroundColor: `${tone}1F` }]}>
        <Ionicons name={icon} size={18} color={tone} />
      </View>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={[styles.metricValue, { color: tone }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function InsightCard({ nudge }: { nudge: SmartNudge }) {
  const colors = {
    warning: {
      ring: "#A9A9A9",
      fill: "rgba(169, 169, 169, 0.16)",
      badge: "rgba(169, 169, 169, 0.18)",
    },
    achievement: {
      ring: "#D9D9D9",
      fill: "rgba(217, 217, 217, 0.16)",
      badge: "rgba(217, 217, 217, 0.18)",
    },
    suggestion: {
      ring: "#BFBFBF",
      fill: "rgba(191, 191, 191, 0.16)",
      badge: "rgba(191, 191, 191, 0.18)",
    },
    forecast: {
      ring: "#CFCFCF",
      fill: "rgba(207, 207, 207, 0.16)",
      badge: "rgba(207, 207, 207, 0.18)",
    },
  }[nudge.type];

  const iconByType: Record<SmartNudge["type"], keyof typeof Ionicons.glyphMap> =
    {
      warning: "trending-down-outline",
      achievement: "trophy-outline",
      suggestion: "bulb-outline",
      forecast: "calendar-outline",
    };

  return (
    <View style={[styles.insightCard, { borderColor: colors.ring + "55" }]}>
      <View style={[styles.insightRing, { borderColor: colors.ring }]}>
        <View
          style={[styles.insightIconFill, { backgroundColor: colors.fill }]}
        >
          <Ionicons
            name={iconByType[nudge.type]}
            size={18}
            color={colors.ring}
          />
        </View>
      </View>

      <View style={styles.insightBody}>
        <View style={styles.insightHeader}>
          <Text style={styles.insightTitle}>{nudge.title}</Text>
          <View
            style={[styles.priorityBadge, { backgroundColor: colors.badge }]}
          >
            <Text style={[styles.priorityText, { color: colors.ring }]}>
              {nudge.priority === "high"
                ? "High Priority"
                : nudge.priority === "medium"
                  ? "Medium"
                  : "Low"}
            </Text>
          </View>
        </View>
        <Text style={styles.insightMessage}>{nudge.message}</Text>
      </View>
    </View>
  );
}

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

  useEffect(() => {
    if (!currentMonth) {
      setCategoryTrends([]);
      setSavingsMetrics(null);
      setForecast(null);
      setNudges([]);
      return;
    }

    const previousMonth = [...archivedMonths].sort(
      (a, b) => b.archivedDate - a.archivedDate,
    )[0];

    const trends = calculateCategoryTrends(
      currentMonth,
      previousMonth || undefined,
    );
    setCategoryTrends(trends);

    const targetSavingsRate = 20;
    const savings = calculateSavingsMetrics(
      monthlyIncome || 0,
      currentMonth.monthlyTotal,
      targetSavingsRate,
    );
    setSavingsMetrics(savings);

    const now = new Date();
    const daysElapsed = now.getDate();
    const forecastData = monthlyIncome
      ? calculateMonthEndForecast(
          monthlyIncome,
          currentMonth.monthlyTotal,
          daysElapsed,
        )
      : null;
    setForecast(forecastData);

    const smartNudges = forecastData
      ? generateSmartNudges(savings, forecastData, trends, salaryDay)
      : [];
    setNudges(smartNudges);
  }, [currentMonth, monthlyIncome, archivedMonths, salaryDay]);

  if (loading || contextLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={ANALYTICS_THEME.text} />
      </SafeAreaView>
    );
  }

  const income = monthlyIncome || 0;
  const expenses = currentMonth?.monthlyTotal || 0;
  const savingsAmount = Math.max(0, income - expenses);
  const savingsRate = income > 0 ? (savingsAmount / income) * 100 : 0;
  const targetRate = savingsMetrics?.targetSavingsRate ?? 20;
  const daysRemaining =
    forecast?.daysRemaining ?? Math.max(0, 30 - new Date().getDate());
  const sortedTrends = [...categoryTrends]
    .filter((trend) => trend.currentMonth > 0 || trend.previousMonth > 0)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));
  const insightsCount = nudges.length;
  const forecastProjection = forecast
    ? Math.min((forecast.projectedTotal / Math.max(1, income)) * 100, 140)
    : 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={ANALYTICS_THEME.background}
      />
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.headerTitle}>Analytics</Text>
            <Text style={styles.headerSubtitle}>
              Intelligent insights for your financial growth
            </Text>
          </View>

          <TouchableOpacity style={styles.headerAction} activeOpacity={0.85}>
            <Ionicons name="sparkles" size={18} color={ANALYTICS_THEME.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.sectionGap}>
          <View style={styles.panelHeaderRow}>
            <View style={styles.panelTitleWrap}>
              <View style={styles.panelDot} />
              <Text style={styles.panelTitle}>Savings Rate Tracker</Text>
            </View>
            <TouchableOpacity style={styles.detailsPill} activeOpacity={0.85}>
              <Text style={styles.detailsPillText}>View Details</Text>
              <Ionicons name="chevron-forward" size={16} color="#111111" />
            </TouchableOpacity>
          </View>

          <View style={styles.card}>
            <View style={styles.metricStrip}>
              <MetricPill
                icon="trending-up-outline"
                label="Income"
                value={formatCompactINR(income)}
                tone={ANALYTICS_THEME.text}
              />
              <View style={styles.metricDivider} />
              <MetricPill
                icon="wallet-outline"
                label="Expenses"
                value={formatCompactINR(expenses)}
                tone={ANALYTICS_THEME.muted}
              />
              <View style={styles.metricDivider} />
              <MetricPill
                icon="cash-outline"
                label="Savings"
                value={formatCompactINR(savingsAmount)}
                tone="#777777"
              />
            </View>

            <View style={styles.cardDivider} />

            <View style={styles.secondaryMetricsRow}>
              <View style={styles.secondaryMetric}>
                <Text style={styles.secondaryLabel}>Your Savings Rate</Text>
                <Text
                  style={[
                    styles.secondaryValue,
                    { color: ANALYTICS_THEME.text },
                  ]}
                  numberOfLines={1}
                >
                  {savingsRate.toFixed(1)}%
                </Text>
                <View style={styles.tagPillMono}>
                  <Text style={styles.tagPillTextMono}>
                    {savingsRate >= targetRate ? "Excellent" : "Needs work"}
                  </Text>
                </View>
              </View>

              <View style={styles.verticalDivider} />

              <View style={styles.secondaryMetric}>
                <Text style={styles.secondaryLabel}>Target Rate</Text>
                <Text
                  style={[
                    styles.secondaryValue,
                    { color: ANALYTICS_THEME.text },
                  ]}
                  numberOfLines={1}
                >
                  {targetRate.toFixed(1)}%
                </Text>
                <View style={styles.tagPillMono}>
                  <Text style={styles.tagPillTextMono}>On Track</Text>
                </View>
              </View>

              <View style={styles.verticalDivider} />

              <View style={styles.secondaryMetric}>
                <Text style={styles.secondaryLabel}>Status</Text>
                <Text
                  style={[
                    styles.secondaryValue,
                    {
                      color:
                        savingsRate >= targetRate
                          ? ANALYTICS_THEME.text
                          : ANALYTICS_THEME.muted,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {savingsRate >= targetRate ? "✓ On Track" : "Below Target"}
                </Text>
                <Text style={styles.secondarySubtext}>
                  {savingsRate >= targetRate
                    ? "Great job!"
                    : "Trim spending to catch up"}
                </Text>
              </View>
            </View>

            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(savingsRate, 100)}%`,
                    backgroundColor:
                      savingsRate >= targetRate
                        ? ANALYTICS_THEME.text
                        : ANALYTICS_THEME.muted,
                  },
                ]}
              />
              <View style={styles.progressLabelBubble}>
                <Text style={styles.progressLabelText}>
                  {savingsRate.toFixed(1)}%
                </Text>
              </View>
              <Text style={styles.progressMaxText}>100%</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionGap}>
          <View style={styles.panelHeaderRow}>
            <View style={styles.panelTitleWrap}>
              <View
                style={[
                  styles.panelDot,
                    { backgroundColor: ANALYTICS_THEME.text },
                ]}
              />
              <Text style={styles.panelTitle}>Month-End Forecast</Text>
            </View>
            <View style={styles.daysLeftPill}>
              <Ionicons name="calendar-outline" size={14} color="#111111" />
              <Text style={styles.daysLeftPillText}>
                {daysRemaining} Days Left
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.forecastTopRow}>
              <View style={styles.forecastLeft}>
                <Text style={styles.forecastLabel}>Current Pace</Text>
                <Text style={styles.forecastValue}>
                    {formatCompactINR(forecast?.currentPace || 0)}
                  <Text style={styles.forecastSuffix}>/day</Text>
                </Text>
                <View style={styles.sparklineWrap}>
                  <Svg width={CHART_WIDTH} height={56}>
                    <Defs>
                      <LinearGradient
                        id="forecastLine"
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <Stop offset="0" stopColor="#111111" stopOpacity="0.9" />
                        <Stop offset="1" stopColor="#8A8A8A" stopOpacity="0.9" />
                      </LinearGradient>
                    </Defs>
                    <Path
                      d={
                        buildSparklinePath(
                          [
                            expenses * 0.72,
                            expenses * 0.79,
                            expenses * 0.76,
                            expenses * 0.88,
                            expenses * 0.84,
                            expenses * 0.93,
                            forecast?.currentPace || expenses * 0.02,
                          ],
                          CHART_WIDTH,
                          56,
                        ).areaPath
                      }
                        fill="rgba(0, 0, 0, 0.05)"
                    />
                    <Path
                      d={
                        buildSparklinePath(
                          [
                            expenses * 0.72,
                            expenses * 0.79,
                            expenses * 0.76,
                            expenses * 0.88,
                            expenses * 0.84,
                            expenses * 0.93,
                            forecast?.currentPace || expenses * 0.02,
                          ],
                          CHART_WIDTH,
                          56,
                        ).linePath
                      }
                      fill="none"
                      stroke="url(#forecastLine)"
                      strokeWidth={3}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </Svg>
                </View>
              </View>

              <View style={styles.forecastDivider} />

              <View style={styles.forecastRight}>
                <Text style={styles.forecastLabel}>Projected Total</Text>
                <Text
                  style={[
                    styles.forecastProjected,
                    {
                      color:
                        forecast && forecast.variance > 0
                          ? ANALYTICS_THEME.red
                          : ANALYTICS_THEME.green,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {formatCompactINR(forecast?.projectedTotal || 0)}
                </Text>
                <Text style={styles.forecastSubtext}>
                  {forecast
                    ? forecast.variance > 0
                      ? `Over budget by ${formatCompactINR(forecast.variance)}`
                      : `Under budget by ${formatCompactINR(Math.abs(forecast.variance))}`
                    : "Forecast will appear once income is set"}
                </Text>
              </View>
            </View>

            <View style={styles.forecastProgressTrack}>
              <View
                style={[
                  styles.forecastProgressFill,
                  {
                    width: `${forecastProjection}%`,
                    backgroundColor:
                      forecast && forecast.variance > 0
                        ? ANALYTICS_THEME.red
                        : ANALYTICS_THEME.teal,
                  },
                ]}
              />
              <View style={styles.forecastMarker} />
            </View>
          </View>
        </View>

        <View style={styles.sectionGap}>
          <View style={styles.panelHeaderRow}>
            <View style={styles.panelTitleWrap}>
              <View
                style={[
                  styles.panelDot,
                    { backgroundColor: ANALYTICS_THEME.text },
                ]}
              />
              <Text style={styles.panelTitle}>Category Trends</Text>
            </View>
            <View style={styles.filterPill}>
              <Text style={styles.filterPillText}>vs Last Month</Text>
              <Ionicons name="chevron-down" size={16} color="#111111" />
            </View>
          </View>

          <View style={styles.card}>
            {sortedTrends.length > 0 ? (
              sortedTrends.slice(0, 5).map((trend, index) => {
                const accent = getCategoryAccent(trend.category);
                const iconName =
                  CATEGORY_ICONS[trend.category] ?? "wallet-outline";
                const isDown = trend.trend === "down";
                const isUp = trend.trend === "up";
                const trendColor = isDown
                  ? ANALYTICS_THEME.text
                  : isUp
                    ? ANALYTICS_THEME.muted
                    : ANALYTICS_THEME.muted;
                const spark = buildSparklinePath(
                  getCategoryHistory(trend),
                  96,
                  30,
                );

                return (
                  <View
                    key={trend.category}
                    style={[
                      styles.categoryRow,
                      index !== sortedTrends.slice(0, 5).length - 1 &&
                        styles.categoryRowBorder,
                    ]}
                  >
                    <View style={styles.categoryLeft}>
                      <View
                        style={[
                          styles.categoryIconWrap,
                          { backgroundColor: `${accent}20` },
                        ]}
                      >
                        <Ionicons name={iconName} size={18} color={accent} />
                      </View>
                      <View style={styles.categoryCopy}>
                        <Text style={styles.categoryName}>
                          {trend.category}
                        </Text>
                        <Text style={styles.categorySpent}>
                          {formatCompactINR(trend.currentMonth)}
                          <Text style={styles.categoryPrevious}>
                            {trend.previousMonth > 0
                              ? `  (was ${formatCompactINR(trend.previousMonth)})`
                              : ""}
                          </Text>
                        </Text>
                      </View>
                    </View>

                    <View style={styles.categoryRight}>
                      <Svg width={96} height={30}>
                        <Path d={spark.areaPath} fill={`${accent}18`} />
                        <Path
                          d={spark.linePath}
                          fill="none"
                          stroke={accent}
                          strokeWidth={2.2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </Svg>
                      <View
                        style={[
                          styles.deltaBadge,
                          { backgroundColor: `${trendColor}20` },
                        ]}
                      >
                        <Text style={[styles.deltaText, { color: trendColor }]}>
                          {isDown ? "↓" : isUp ? "↑" : "→"}{" "}
                          {Math.abs(trend.changePercent).toFixed(1)}%
                        </Text>
                      </View>
                    </View>
                  </View>
                );
              })
            ) : (
              <View style={styles.emptyState}>
                <Ionicons
                  name="analytics-outline"
                  size={28}
                  color={ANALYTICS_THEME.muted}
                />
                <Text style={styles.emptyStateTitle}>
                  No category movement yet
                </Text>
                <Text style={styles.emptyStateText}>
                  Add a few expenses to see monthly trend comparisons here.
                </Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.sectionGap}>
          <View style={styles.panelHeaderRow}>
            <View style={styles.panelTitleWrap}>
              <View
                style={[
                  styles.panelDot,
                    { backgroundColor: ANALYTICS_THEME.text },
                ]}
              />
              <Text style={styles.panelTitle}>Smart Insights</Text>
            </View>
            <Text style={styles.newInsightsText}>
              {insightsCount} New Insights
            </Text>
          </View>

          {nudges.length > 0 ? (
            <View style={styles.insightStack}>
              {nudges.slice(0, 3).map((nudge) => (
                <InsightCard
                  key={`${nudge.title}-${nudge.type}`}
                  nudge={nudge}
                />
              ))}
            </View>
          ) : (
            <View style={styles.card}>
              <View style={styles.emptyState}>
                <Ionicons
                  name="bulb-outline"
                  size={28}
                  color={ANALYTICS_THEME.muted}
                />
                <Text style={styles.emptyStateTitle}>
                  Insights will appear here
                </Text>
                <Text style={styles.emptyStateText}>
                  Your savings, forecast, and category trends will power
                  personalized alerts.
                </Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ANALYTICS_THEME.background,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: ANALYTICS_THEME.background,
  },
  scrollView: {
    flex: 1,
    backgroundColor: ANALYTICS_THEME.background,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  headerCopy: {
    flex: 1,
    paddingRight: 16,
  },
  headerTitle: {
    ...Typography.display,
    color: ANALYTICS_THEME.text,
    letterSpacing: -0.4,
  },
  headerSubtitle: {
    marginTop: 8,
    color: ANALYTICS_THEME.muted,
    ...Typography.bodyMedium,
  },
  headerAction: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F3F3",
    borderWidth: 1,
    borderColor: ANALYTICS_THEME.border,
  },
  sectionGap: {
    marginBottom: 18,
  },
  panelHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  panelTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  panelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ANALYTICS_THEME.teal,
  },
  panelTitle: {
    color: ANALYTICS_THEME.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    ...Typography.label,
  },
  detailsPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#F6F6F6",
    borderWidth: 1,
    borderColor: ANALYTICS_THEME.border,
  },
  detailsPillText: {
    color: ANALYTICS_THEME.text,
    ...Typography.bodySmall,
  },
  daysLeftPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F6F6F6",
    borderWidth: 1,
    borderColor: ANALYTICS_THEME.border,
  },
  daysLeftPillText: {
    color: ANALYTICS_THEME.text,
    ...Typography.label,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#F6F6F6",
    borderWidth: 1,
    borderColor: ANALYTICS_THEME.border,
  },
  filterPillText: {
    color: ANALYTICS_THEME.text,
    ...Typography.bodySmall,
  },
  newInsightsText: {
    color: ANALYTICS_THEME.text,
    ...Typography.h6,
  },
  card: {
    borderRadius: 24,
    padding: 16,
    backgroundColor: ANALYTICS_THEME.surface,
    borderWidth: 1,
    borderColor: ANALYTICS_THEME.border,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 1,
  },
  metricStrip: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  metricPill: {
    flex: 1,
    alignItems: "flex-start",
    paddingRight: 8,
  },
  metricIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  metricLabel: {
    color: ANALYTICS_THEME.muted,
    ...Typography.caption,
    textTransform: "capitalize",
    marginBottom: 3,
  },
  metricValue: {
    ...Typography.h5,
    letterSpacing: -0.1,
  },
  metricDivider: {
    width: 1,
    backgroundColor: ANALYTICS_THEME.border,
    marginHorizontal: 8,
  },
  cardDivider: {
    height: 1,
    backgroundColor: ANALYTICS_THEME.border,
    marginVertical: 16,
  },
  secondaryMetricsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    justifyContent: "space-between",
  },
  secondaryMetric: {
    flex: 1,
    alignItems: "flex-start",
  },
  secondaryLabel: {
    color: ANALYTICS_THEME.muted,
    ...Typography.caption,
    marginBottom: 4,
  },
  secondaryValue: {
    ...Typography.h5,
    letterSpacing: -0.1,
    marginBottom: 6,
  },
  secondarySubtext: {
    color: ANALYTICS_THEME.muted,
    ...Typography.caption,
    marginTop: 3,
  },
  tagPillGreen: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#EFEFEF",
  },
  tagPillAmber: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#EFEFEF",
  },
  tagPillMono: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "#EFEFEF",
  },
  tagPillTextGreen: {
    color: ANALYTICS_THEME.text,
    ...Typography.labelSmall,
  },
  tagPillTextAmber: {
    color: ANALYTICS_THEME.text,
    ...Typography.labelSmall,
  },
  tagPillTextMono: {
    color: ANALYTICS_THEME.text,
    ...Typography.labelSmall,
  },
  verticalDivider: {
    width: 1,
    backgroundColor: ANALYTICS_THEME.border,
    marginHorizontal: 14,
  },
  progressTrack: {
    marginTop: 18,
    height: 12,
    borderRadius: 999,
    backgroundColor: ANALYTICS_THEME.surfaceStrong,
    overflow: "hidden",
    justifyContent: "center",
  },
  progressFill: {
    height: 12,
    borderRadius: 999,
  },
  progressLabelBubble: {
    position: "absolute",
    left: "50%",
    top: -11,
    transform: [{ translateX: -18 }],
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  progressLabelText: {
    color: ANALYTICS_THEME.text,
    ...Typography.caption,
  },
  progressMaxText: {
    position: "absolute",
    right: 0,
    color: ANALYTICS_THEME.muted,
    ...Typography.labelSmall,
  },
  forecastTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  forecastLeft: {
    flex: 1.2,
    paddingRight: 10,
  },
  forecastRight: {
    flex: 0.95,
    paddingLeft: 10,
    alignItems: "flex-start",
  },
  forecastLabel: {
    color: ANALYTICS_THEME.muted,
    ...Typography.caption,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },
  forecastValue: {
    color: ANALYTICS_THEME.text,
    ...Typography.h5,
    letterSpacing: -0.1,
  },
  forecastSuffix: {
    ...Typography.caption,
    color: ANALYTICS_THEME.muted,
  },
  sparklineWrap: {
    marginTop: 10,
  },
  forecastDivider: {
    width: 1,
    alignSelf: "stretch",
    backgroundColor: ANALYTICS_THEME.border,
  },
  forecastProjected: {
    ...Typography.h5,
    letterSpacing: -0.1,
    marginBottom: 6,
  },
  forecastSubtext: {
    ...Typography.caption,
    color: ANALYTICS_THEME.muted,
  },
  forecastProgressTrack: {
    marginTop: 16,
    height: 11,
    borderRadius: 999,
    backgroundColor: ANALYTICS_THEME.surfaceStrong,
    overflow: "hidden",
  },
  forecastProgressFill: {
    height: "100%",
    borderRadius: 999,
  },
  forecastMarker: {
    position: "absolute",
    right: "18%",
    top: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderLeftColor: "rgba(0,0,0,0.45)",
    borderStyle: "dashed",
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  categoryRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: ANALYTICS_THEME.border,
  },
  categoryLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    paddingRight: 14,
  },
  categoryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  categoryCopy: {
    flex: 1,
  },
  categoryName: {
    color: ANALYTICS_THEME.text,
    ...Typography.h6,
    marginBottom: 3,
  },
  categorySpent: {
    color: ANALYTICS_THEME.text,
    ...Typography.h6,
  },
  categoryPrevious: {
    color: ANALYTICS_THEME.muted,
    ...Typography.caption,
  },
  categoryRight: {
    alignItems: "flex-end",
    gap: 10,
  },
  deltaBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  deltaText: {
    ...Typography.labelSmall,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    marginTop: 10,
    color: ANALYTICS_THEME.text,
    ...Typography.h6,
  },
  emptyStateText: {
    marginTop: 6,
    color: ANALYTICS_THEME.muted,
    textAlign: "center",
    ...Typography.label,
  },
  insightStack: {
    gap: 12,
  },
  insightCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 22,
    padding: 15,
    backgroundColor: ANALYTICS_THEME.surface,
    borderWidth: 1,
  },
  insightRing: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  insightIconFill: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  insightBody: {
    flex: 1,
  },
  insightHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 8,
  },
  insightTitle: {
    flex: 1,
    color: ANALYTICS_THEME.text,
    ...Typography.h6,
  },
  priorityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  priorityText: {
    ...Typography.caption,
  },
  insightMessage: {
    color: ANALYTICS_THEME.muted,
    ...Typography.bodySmall,
  },
});
