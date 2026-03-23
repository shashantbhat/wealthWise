import {
    MarketIndexSnapshot,
    fetchIndianIndices,
} from "@/app/utils/marketIndices";
import { TabTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

function formatIndexValue(value: number) {
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function buildSparklinePaths(
  points: number[],
  width: number,
  height: number,
): { linePath: string; areaPath: string } {
  if (points.length === 0) {
    const flatY = height / 2;
    return {
      linePath: `M0 ${flatY} L${width} ${flatY}`,
      areaPath: `M0 ${height} L0 ${flatY} L${width} ${flatY} L${width} ${height} Z`,
    };
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const range = Math.max(1, max - min);
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  const coordinates = points.map((value, index) => {
    const x = index * stepX;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  const linePath = coordinates
    .map((point, index) => {
      const prefix = index === 0 ? "M" : "L";
      return `${prefix}${point.x} ${point.y}`;
    })
    .join(" ");

  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  const areaPath = `M${first.x} ${height} ${linePath.replaceAll("M", "L")} L${last.x} ${height} Z`;

  return {
    linePath,
    areaPath,
  };
}

function MarketIndexCard({ index }: { index: MarketIndexSnapshot }) {
  const isPositive = index.change >= 0;
  const trendColor = isPositive ? "#29C983" : "#FF4C43";
  const { linePath, areaPath } = useMemo(
    () => buildSparklinePaths(index.points, 88, 34),
    [index.points],
  );

  return (
    <View style={styles.indexRow}>
      <View style={styles.indexLeftCol}>
        <Text style={styles.indexExchange}>{index.exchangeSymbol}</Text>
        <Text style={styles.indexName}>{index.symbol}</Text>
      </View>

      <View style={styles.sparklineWrap}>
        <Svg width={88} height={34}>
          <Defs>
            <LinearGradient
              id={`indexFill${index.exchangeSymbol}`}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <Stop offset="0" stopColor={trendColor} stopOpacity="0.45" />
              <Stop offset="1" stopColor={trendColor} stopOpacity="0.03" />
            </LinearGradient>
          </Defs>
          <Path d={areaPath} fill={`url(#indexFill${index.exchangeSymbol})`} />
          <Path
            d={linePath}
            fill="none"
            stroke={trendColor}
            strokeWidth={2.5}
          />
        </Svg>
      </View>

      <View style={styles.indexRightCol}>
        <Text style={styles.indexValue}>{formatIndexValue(index.value)}</Text>
        <View
          style={[
            styles.indexDayBadge,
            {
              backgroundColor: isPositive
                ? "rgba(41, 201, 131, 0.17)"
                : "rgba(255, 76, 67, 0.17)",
            },
          ]}
        >
          <Text style={[styles.indexDayBadgeText, { color: trendColor }]}>
            {isPositive ? "+" : ""}
            {index.changePercent.toFixed(2)}% DAY
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function PortfolioScreen() {
  const [marketIndices, setMarketIndices] = useState<MarketIndexSnapshot[]>([]);
  const [indicesLoading, setIndicesLoading] = useState(true);
  const [indicesError, setIndicesError] = useState<string | null>(null);

  const loadIndices = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) {
      setIndicesLoading(true);
    }

    try {
      const latest = await fetchIndianIndices();
      setMarketIndices(latest);
      setIndicesError(null);
    } catch {
      setIndicesError("Live index feed is unavailable right now.");
    } finally {
      if (showSpinner) {
        setIndicesLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadIndices(true);
    const timer = setInterval(() => {
      void loadIndices(false);
    }, 45000);

    return () => clearInterval(timer);
  }, [loadIndices]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={TabTheme.background}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Your Portfolio</Text>
          <Text style={styles.subtitle}>
            Track total value, P&L, and holdings from your connected account.
          </Text>
        </View>

        <View style={styles.indicesSection}>
          <View style={styles.indicesHeaderRow}>
            <Text style={styles.indicesTitle}>Live Indices</Text>
            <TouchableOpacity
              onPress={() => void loadIndices(true)}
              style={styles.indicesRefreshButton}
              activeOpacity={0.85}
            >
              <Ionicons name="refresh" size={15} color="#A9B2C2" />
              <Text style={styles.indicesRefreshText}>Refresh</Text>
            </TouchableOpacity>
          </View>

          {indicesLoading && marketIndices.length === 0 ? (
            <View style={styles.indicesLoadingState}>
              <ActivityIndicator color={TabTheme.accent} size="small" />
              <Text style={styles.indicesLoadingText}>
                Loading NIFTY and SENSEX...
              </Text>
            </View>
          ) : (
            <View style={styles.indicesPanel}>
              {marketIndices.map((indexItem) => (
                <View
                  key={indexItem.exchangeSymbol}
                  style={styles.indexRowWrap}
                >
                  <MarketIndexCard index={indexItem} />
                </View>
              ))}
              <Text style={styles.indexAsOf}>
                Updated{" "}
                {new Date(
                  marketIndices[0]?.asOf ?? Date.now(),
                ).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          )}

          {indicesError ? (
            <Text style={styles.indicesError}>{indicesError}</Text>
          ) : null}
        </View>

        <View style={styles.holdingsCard}>
          <Text style={styles.holdingsTitle}>Holdings</Text>
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={20} color="#8E98AD" />
            <Text style={styles.emptyStateText}>
              Holdings will appear here once connected.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: TabTheme.background,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 36,
  },
  header: {
    marginBottom: 16,
  },
  indicesSection: {
    marginBottom: 14,
  },
  indicesHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  indicesTitle: {
    color: TabTheme.text,
    fontSize: 16,
    fontWeight: "700",
  },
  indicesRefreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#111111",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#2A2A2A",
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  indicesRefreshText: {
    color: "#D7D7D7",
    fontSize: 12,
    fontWeight: "600",
  },
  indicesPanel: {
    backgroundColor: TabTheme.surface,
    borderWidth: 1,
    borderColor: TabTheme.border,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  indexRowWrap: {
    borderBottomColor: TabTheme.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: 9,
  },
  indicesLoadingState: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: TabTheme.border,
    backgroundColor: TabTheme.surface,
    paddingVertical: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  indicesLoadingText: {
    color: TabTheme.textMuted,
    fontSize: 13,
  },
  indicesError: {
    color: "#CE4D4D",
    fontSize: 12,
    marginTop: 8,
  },
  indexRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  indexLeftCol: {
    flex: 1,
    minWidth: 94,
  },
  indexExchange: {
    color: TabTheme.text,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  indexName: {
    color: TabTheme.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginTop: 2,
  },
  sparklineWrap: {
    width: 88,
    alignItems: "center",
  },
  indexRightCol: {
    alignItems: "flex-end",
    minWidth: 104,
  },
  indexValue: {
    color: TabTheme.text,
    fontSize: 18,
    fontWeight: "800",
  },
  indexDayBadge: {
    marginTop: 6,
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  indexDayBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
  indexAsOf: {
    color: TabTheme.textMuted,
    marginTop: 8,
    marginBottom: 4,
    fontSize: 11,
    textAlign: "right",
  },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: TabTheme.text,
    marginBottom: 4,
  },
  subtitle: {
    color: TabTheme.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },

  holdingsCard: {
    backgroundColor: TabTheme.surface,
    borderColor: TabTheme.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  holdingsTitle: {
    fontSize: 17,
    color: TabTheme.text,
    fontWeight: "700",
    marginBottom: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TabTheme.border,
    borderStyle: "dashed",
    paddingVertical: 20,
    marginTop: 2,
  },
  emptyStateText: {
    color: TabTheme.textMuted,
    fontSize: 13,
  },
});
