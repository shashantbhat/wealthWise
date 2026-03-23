import { DhanHolding, fetchDhanHoldings } from "@/app/utils/dhanApi";
import {
    MarketIndexSnapshot,
    fetchIndianIndices,
} from "@/app/utils/marketIndices";
import { TabTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import Svg, { Defs, LinearGradient, Path, Stop } from "react-native-svg";

type Holding = {
  symbol: string;
  name: string;
  quantity: number;
  avgPrice: number;
  lastPrice: number;
  invested: number;
  current: number;
};

function toHolding(item: DhanHolding): Holding {
  return {
    symbol: item.symbol,
    name: item.name,
    quantity: item.quantity,
    avgPrice: item.avgPrice,
    lastPrice: item.lastPrice,
    invested: item.invested,
    current: item.current,
  };
}

function formatINR(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`;
}

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
  const [apiKey, setApiKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [hideKey, setHideKey] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [marketIndices, setMarketIndices] = useState<MarketIndexSnapshot[]>([]);
  const [indicesLoading, setIndicesLoading] = useState(true);
  const [indicesError, setIndicesError] = useState<string | null>(null);

  const summary = useMemo(() => {
    const totalInvested = holdings.reduce(
      (sum, holding) => sum + holding.invested,
      0,
    );
    const totalCurrent = holdings.reduce(
      (sum, holding) => sum + holding.current,
      0,
    );
    const pnl = totalCurrent - totalInvested;
    const pnlPercent = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCurrent,
      pnl,
      pnlPercent,
    };
  }, [holdings]);

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

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      Alert.alert(
        "Missing API key",
        "Please enter your account API key first.",
      );
      return;
    }

    setIsLoading(true);
    try {
      const liveHoldings = await fetchDhanHoldings(apiKey.trim());
      setHoldings(liveHoldings.map(toHolding));
      setConnected(true);
      Alert.alert(
        "Connected",
        `Fetched ${liveHoldings.length} holdings from Dhan.`,
      );
    } catch (error) {
      setConnected(false);
      const message =
        error instanceof Error
          ? error.message
          : "Unable to fetch holdings from Dhan. Please try again.";
      Alert.alert("Connection failed", message);
    } finally {
      setIsLoading(false);
    }
  };

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

        <View style={styles.connectCard}>
          <View style={styles.connectTitleRow}>
            <Ionicons name="key-outline" size={18} color={TabTheme.accent} />
            <Text style={styles.connectTitle}>Connect Account API Key</Text>
          </View>

          <View style={styles.keyInputRow}>
            <TextInput
              style={styles.keyInput}
              placeholder="Enter your broker API key"
              placeholderTextColor="#7B8192"
              value={apiKey}
              onChangeText={setApiKey}
              secureTextEntry={hideKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setHideKey((current) => !current)}
              style={styles.eyeButton}
              activeOpacity={0.8}
            >
              <Ionicons
                name={hideKey ? "eye-off-outline" : "eye-outline"}
                size={18}
                color="#777777"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.connectButton,
              connected && styles.connectButtonDone,
            ]}
            onPress={handleConnect}
            disabled={isLoading}
            activeOpacity={0.9}
          >
            {isLoading ? (
              <ActivityIndicator color="#04140F" size="small" />
            ) : (
              <Text style={styles.connectButtonText}>
                {connected ? "Refresh" : "Connect"}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabel}>Current Value</Text>
            <Text style={styles.cardValue}>
              {formatINR(summary.totalCurrent)}
            </Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.cardLabel}>Total Invested</Text>
            <Text style={styles.cardValue}>
              {formatINR(summary.totalInvested)}
            </Text>
          </View>
        </View>

        <View style={styles.pnlCard}>
          <Text style={styles.cardLabel}>Overall P&L</Text>
          <Text
            style={[
              styles.pnlValue,
              summary.pnl >= 0 ? styles.pnlPositive : styles.pnlNegative,
            ]}
          >
            {summary.pnl >= 0 ? "+" : ""}
            {formatINR(summary.pnl)} ({summary.pnlPercent.toFixed(2)}%)
          </Text>
        </View>

        <View style={styles.holdingsCard}>
          <Text style={styles.holdingsTitle}>Holdings</Text>
          {holdings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={20} color="#8E98AD" />
              <Text style={styles.emptyStateText}>
                Connect your Dhan API key to load live holdings.
              </Text>
            </View>
          ) : (
            holdings.map((holding) => {
              const gain = holding.current - holding.invested;
              const gainPercent = (gain / holding.invested) * 100;

              return (
                <View key={holding.symbol} style={styles.holdingItem}>
                  <View style={styles.holdingInfo}>
                    <Text style={styles.holdingSymbol}>{holding.symbol}</Text>
                    <Text style={styles.holdingName}>{holding.name}</Text>
                    <Text style={styles.holdingMeta}>
                      Qty {holding.quantity.toLocaleString("en-IN")} | Avg{" "}
                      {formatINR(holding.avgPrice)}
                    </Text>
                  </View>
                  <View style={styles.holdingValues}>
                    <Text style={styles.holdingCurrent}>
                      {formatINR(holding.current)}
                    </Text>
                    <Text
                      style={[
                        styles.holdingGain,
                        gain >= 0 ? styles.pnlPositive : styles.pnlNegative,
                      ]}
                    >
                      {gain >= 0 ? "+" : ""}
                      {Number.isFinite(gainPercent)
                        ? gainPercent.toFixed(2)
                        : "0.00"}
                      %
                    </Text>
                  </View>
                </View>
              );
            })
          )}
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
  connectCard: {
    backgroundColor: TabTheme.surface,
    borderColor: TabTheme.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  connectTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  connectTitle: {
    color: TabTheme.text,
    fontSize: 14,
    fontWeight: "700",
  },
  keyInputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    backgroundColor: TabTheme.surfaceMuted,
    borderWidth: 1,
    borderColor: TabTheme.border,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  keyInput: {
    flex: 1,
    color: TabTheme.text,
    fontSize: 14,
    paddingVertical: 12,
  },
  eyeButton: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  connectButton: {
    backgroundColor: TabTheme.accent,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  connectButtonDone: {
    backgroundColor: "#078D9C",
  },
  connectButtonText: {
    color: "#04140F",
    fontWeight: "800",
    fontSize: 14,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
    marginBottom: 10,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: TabTheme.surface,
    borderColor: TabTheme.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  cardLabel: {
    fontSize: 11,
    color: TabTheme.textMuted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginBottom: 6,
  },
  cardValue: {
    fontSize: 19,
    color: TabTheme.text,
    fontWeight: "700",
  },
  pnlCard: {
    backgroundColor: TabTheme.surface,
    borderColor: TabTheme.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  pnlValue: {
    fontSize: 24,
    fontWeight: "800",
  },
  pnlPositive: {
    color: TabTheme.accent,
  },
  pnlNegative: {
    color: "#FF6B6B",
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
  holdingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomColor: TabTheme.border,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  holdingInfo: {
    flex: 1,
    paddingRight: 8,
  },
  holdingSymbol: {
    color: TabTheme.text,
    fontSize: 14,
    fontWeight: "700",
  },
  holdingName: {
    color: TabTheme.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  holdingMeta: {
    color: TabTheme.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  holdingValues: {
    alignItems: "flex-end",
  },
  holdingCurrent: {
    color: TabTheme.text,
    fontWeight: "700",
    fontSize: 14,
  },
  holdingGain: {
    marginTop: 2,
    fontSize: 12,
    fontWeight: "700",
  },
});
