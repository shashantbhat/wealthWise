import { SUPPORTED_BROKERS } from "@/app/utils/brokers/brokerConfig";
import { fetchBrokerHoldings } from "@/app/utils/brokers/brokerHandler";
import {
    DhanHolding,
    DhanPosition,
    fetchDhanPositions,
} from "@/app/utils/dhanApi";
import {
    MarketIndexSnapshot,
    fetchIndianIndices,
} from "@/app/utils/marketIndices";
import {
    clearBrokerConfig,
    loadBrokerConfig,
    saveBrokerConfig,
} from "@/app/utils/userContextStorage";
import { BrokerConnectModal } from "@/components/home/BrokerConnectModal";
import { TabTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
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

  const [holdings, setHoldings] = useState<DhanHolding[]>([]);
  const [holdingsLoading, setHoldingsLoading] = useState(false);
  const [holdingsError, setHoldingsError] = useState<string | null>(null);

  const [positions, setPositions] = useState<DhanPosition[]>([]);
  const [positionsLoading, setPositionsLoading] = useState(false);
  const [positionsError, setPositionsError] = useState<string | null>(null);

  const [brokerModalVisible, setBrokerModalVisible] = useState(false);
  const [isBrokerConnected, setIsBrokerConnected] = useState(false);

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

  const loadHoldings = useCallback(async (apiKey: string, brokerId: string) => {
    setHoldingsLoading(true);
    setHoldingsError(null);
    try {
      const brokerInfo = SUPPORTED_BROKERS[brokerId];
      if (!brokerInfo) {
        throw new Error("Invalid broker selected");
      }

      const fetchedHoldings = await fetchBrokerHoldings(brokerInfo, apiKey);
      setHoldings(fetchedHoldings);
      return fetchedHoldings;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load holdings";
      setHoldingsError(errorMessage);
      throw error;
    } finally {
      setHoldingsLoading(false);
    }
  }, []);

  const loadPositions = useCallback(async (apiKey: string) => {
    setPositionsLoading(true);
    setPositionsError(null);
    try {
      const fetchedPositions = await fetchDhanPositions(apiKey);
      setPositions(fetchedPositions);
      return fetchedPositions;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to load positions";
      setPositionsError(errorMessage);
      console.error("Error loading positions:", error);
    } finally {
      setPositionsLoading(false);
    }
  }, []);

  const handleBrokerConnect = useCallback(
    async (brokerId: string, apiKey: string) => {
      try {
        // Verify API key by fetching holdings
        await loadHoldings(apiKey, brokerId);
        // Also load positions
        await loadPositions(apiKey);

        // Save broker configuration
        const brokerInfo = SUPPORTED_BROKERS[brokerId];
        await saveBrokerConfig({
          brokerId,
          brokerName: brokerInfo.displayName,
          apiKey,
          connectedAt: Date.now(),
        });

        setIsBrokerConnected(true);
      } catch (error) {
        throw error;
      }
    },
    [loadHoldings, loadPositions],
  );

  const handleDisconnectBroker = useCallback(() => {
    clearBrokerConfig().catch((error) =>
      console.error("Error clearing broker config:", error),
    );
    setIsBrokerConnected(false);
    setHoldings([]);
    setPositions([]);
    setHoldingsError(null);
    setPositionsError(null);
  }, []);

  // Load broker config and holdings on mount
  useEffect(() => {
    const initializeBroker = async () => {
      try {
        const config = await loadBrokerConfig();
        if (config?.apiKey && config?.brokerId) {
          setIsBrokerConnected(true);
          await loadHoldings(config.apiKey, config.brokerId);
          await loadPositions(config.apiKey);
        }
      } catch (error) {
        console.error("Error loading broker config:", error);
      }
    };

    initializeBroker();
  }, [loadHoldings, loadPositions]);

  useEffect(() => {
    void loadIndices(true);
    const timer = setInterval(() => {
      void loadIndices(false);
    }, 45000);

    return () => clearInterval(timer);
  }, [loadIndices]);

  const totalInvested = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.invested, 0);
  }, [holdings]);

  const totalCurrent = useMemo(() => {
    return holdings.reduce((sum, h) => sum + h.current, 0);
  }, [holdings]);

  const totalGainLoss = useMemo(() => {
    return totalCurrent - totalInvested;
  }, [totalCurrent, totalInvested]);

  const totalGainLossPercent = useMemo(() => {
    return totalInvested > 0 ? (totalGainLoss / totalInvested) * 100 : 0;
  }, [totalGainLoss, totalInvested]);

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
        <View style={styles.headerContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Your Portfolio</Text>
            <Text style={styles.subtitle}>
              Track total value, P&L, and holdings from your connected account.
            </Text>
          </View>
          <View style={styles.headerButtons}>
            {isBrokerConnected && (
              <TouchableOpacity
                style={styles.disconnectButton}
                onPress={handleDisconnectBroker}
              >
                <Ionicons name="close-circle" size={24} color="#FF4C43" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.addBrokerButton}
              onPress={() => setBrokerModalVisible(true)}
            >
              <Ionicons
                name={isBrokerConnected ? "swap-horizontal" : "add-circle"}
                size={24}
                color="#4A9EFF"
              />
            </TouchableOpacity>
          </View>
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
          <View style={styles.holdingsHeader}>
            <Text style={styles.holdingsTitle}>Holdings</Text>
            {isBrokerConnected && (
              <View style={styles.connectedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#29C983" />
                <Text style={styles.connectedBadgeText}>Connected</Text>
              </View>
            )}
          </View>

          {holdingsLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={TabTheme.accent} size="small" />
              <Text style={styles.loadingText}>Loading holdings...</Text>
            </View>
          ) : holdings.length > 0 ? (
            <View>
              <View style={styles.portfolioSummary}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Invested</Text>
                  <Text style={styles.summaryValue}>
                    ₹{totalInvested.toFixed(0)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Current</Text>
                  <Text style={styles.summaryValue}>
                    ₹{totalCurrent.toFixed(0)}
                  </Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>Gain/Loss</Text>
                  <Text
                    style={[
                      styles.summaryValue,
                      {
                        color: totalGainLoss >= 0 ? "#29C983" : "#FF4C43",
                      },
                    ]}
                  >
                    {totalGainLoss >= 0 ? "+" : ""}
                    {totalGainLoss.toFixed(0)} (
                    {totalGainLossPercent.toFixed(2)}%)
                  </Text>
                </View>
              </View>

              <View style={styles.holdingsList}>
                {holdings.map((holding, index) => {
                  const gainLoss = holding.current - holding.invested;
                  const gainLossPercent =
                    holding.invested > 0
                      ? (gainLoss / holding.invested) * 100
                      : 0;
                  const isPositive = gainLoss >= 0;

                  return (
                    <View
                      key={holding.symbol}
                      style={[
                        styles.holdingItem,
                        index !== holdings.length - 1 &&
                          styles.holdingItemBorder,
                      ]}
                    >
                      <View style={styles.holdingLeft}>
                        <Text style={styles.holdingSymbol}>
                          {holding.symbol}
                        </Text>
                        <Text style={styles.holdingName}>{holding.name}</Text>
                        <Text style={styles.holdingQty}>
                          Qty: {holding.quantity}
                        </Text>
                      </View>
                      <View style={styles.holdingRight}>
                        <Text style={styles.holdingCurrentValue}>
                          ₹{holding.current.toFixed(0)}
                        </Text>
                        <Text
                          style={[
                            styles.holdingGainLoss,
                            {
                              color: isPositive ? "#29C983" : "#FF4C43",
                            },
                          ]}
                        >
                          {isPositive ? "+" : ""}₹{gainLoss.toFixed(0)} (
                          {gainLossPercent.toFixed(1)}%)
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="wallet-outline" size={20} color="#8E98AD" />
              <Text style={styles.emptyStateText}>
                {isBrokerConnected
                  ? "No holdings found"
                  : "Holdings will appear here once connected."}
              </Text>
            </View>
          )}

          {holdingsError && !holdingsLoading ? (
            <View style={styles.errorState}>
              <Text style={styles.errorText}>{holdingsError}</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.positionsCard}>
          <View style={styles.positionsHeader}>
            <Text style={styles.positionsTitle}>Open Positions</Text>
            {isBrokerConnected && (
              <View style={styles.connectedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#29C983" />
                <Text style={styles.connectedBadgeText}>Live</Text>
              </View>
            )}
          </View>

          {positionsLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={TabTheme.accent} size="small" />
              <Text style={styles.loadingText}>Loading positions...</Text>
            </View>
          ) : positions.length > 0 ? (
            <View style={styles.positionsList}>
              {positions.map((position, index) => {
                const isPositive = position.unrealisedPnl >= 0;
                const positionTypeBg =
                  position.positionType === "INTRADAY"
                    ? "#FF6B6B22"
                    : "#4A9EFF22";
                const positionTypeColor =
                  position.positionType === "INTRADAY" ? "#FF6B6B" : "#4A9EFF";

                return (
                  <View
                    key={position.symbol}
                    style={[
                      styles.positionItem,
                      index !== positions.length - 1 &&
                        styles.positionItemBorder,
                    ]}
                  >
                    <View style={styles.positionLeft}>
                      <View style={styles.positionHeader}>
                        <Text style={styles.positionSymbol}>
                          {position.symbol}
                        </Text>
                        <View
                          style={[
                            styles.positionTypeBadge,
                            { backgroundColor: positionTypeBg },
                          ]}
                        >
                          <Text
                            style={[
                              styles.positionTypeText,
                              { color: positionTypeColor },
                            ]}
                          >
                            {position.positionType}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.positionName}>{position.name}</Text>
                      <Text style={styles.positionDetails}>
                        Qty: {position.quantity} @ ₹
                        {position.entryPrice.toFixed(2)}
                      </Text>
                    </View>
                    <View style={styles.positionRight}>
                      <Text style={styles.positionValue}>
                        ₹{position.positionValue.toFixed(0)}
                      </Text>
                      <Text
                        style={[
                          styles.positionPnL,
                          {
                            color: isPositive ? "#29C983" : "#FF4C43",
                          },
                        ]}
                      >
                        {isPositive ? "+" : ""}₹
                        {position.unrealisedPnl.toFixed(0)} (
                        {position.unrealisedPnlPercent.toFixed(2)}%)
                      </Text>
                      <Text style={styles.currentPrice}>
                        LTP: ₹{position.lastPrice.toFixed(2)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Ionicons
                name="swap-vertical-outline"
                size={20}
                color="#8E98AD"
              />
              <Text style={styles.emptyStateText}>
                {isBrokerConnected
                  ? "No open positions"
                  : "Positions will appear here once connected."}
              </Text>
            </View>
          )}

          {positionsError && !positionsLoading ? (
            <View style={styles.errorState}>
              <Text style={styles.errorText}>{positionsError}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <BrokerConnectModal
        visible={brokerModalVisible}
        onClose={() => setBrokerModalVisible(false)}
        onConnect={handleBrokerConnect}
        isLoading={holdingsLoading}
      />
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
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  header: {
    flex: 1,
  },
  headerButtons: {
    flexDirection: "row",
    gap: 8,
    marginLeft: 12,
  },
  addBrokerButton: {
    padding: 8,
  },
  disconnectButton: {
    padding: 8,
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
  holdingsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  holdingsTitle: {
    fontSize: 17,
    color: TabTheme.text,
    fontWeight: "700",
  },
  connectedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(41, 201, 131, 0.1)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  connectedBadgeText: {
    fontSize: 11,
    color: "#29C983",
    fontWeight: "600",
  },
  portfolioSummary: {
    flexDirection: "row",
    backgroundColor: "rgba(74, 158, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(74, 158, 255, 0.15)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginBottom: 14,
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryLabel: {
    fontSize: 11,
    color: TabTheme.textMuted,
    fontWeight: "600",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 14,
    color: TabTheme.text,
    fontWeight: "700",
  },
  summaryDivider: {
    width: 1,
    backgroundColor: "rgba(74, 158, 255, 0.2)",
    marginHorizontal: 4,
  },
  holdingsList: {
    marginTop: 4,
  },
  holdingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  holdingItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TabTheme.border,
  },
  holdingLeft: {
    flex: 1,
  },
  holdingRight: {
    alignItems: "flex-end",
  },
  holdingSymbol: {
    fontSize: 14,
    color: TabTheme.text,
    fontWeight: "700",
    marginBottom: 2,
  },
  holdingName: {
    fontSize: 12,
    color: TabTheme.textMuted,
    marginBottom: 4,
  },
  holdingQty: {
    fontSize: 11,
    color: TabTheme.textMuted,
    fontWeight: "500",
  },
  holdingCurrentValue: {
    fontSize: 14,
    color: TabTheme.text,
    fontWeight: "700",
    marginBottom: 2,
  },
  holdingGainLoss: {
    fontSize: 12,
    fontWeight: "600",
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
  loadingState: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 20,
  },
  loadingText: {
    color: TabTheme.textMuted,
    fontSize: 13,
  },
  positionsCard: {
    backgroundColor: TabTheme.surface,
    borderWidth: 1,
    borderColor: TabTheme.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 16,
  },
  positionsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  positionsTitle: {
    fontSize: 17,
    color: TabTheme.text,
    fontWeight: "700",
  },
  positionsList: {
    marginTop: 4,
  },
  positionItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
  },
  positionItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TabTheme.border,
  },
  positionLeft: {
    flex: 1,
  },
  positionRight: {
    alignItems: "flex-end",
  },
  positionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  positionSymbol: {
    fontSize: 14,
    color: TabTheme.text,
    fontWeight: "700",
  },
  positionTypeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  positionTypeText: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  positionName: {
    fontSize: 12,
    color: TabTheme.textMuted,
    marginBottom: 4,
  },
  positionDetails: {
    fontSize: 11,
    color: TabTheme.textMuted,
    fontWeight: "500",
  },
  positionValue: {
    fontSize: 14,
    color: TabTheme.text,
    fontWeight: "700",
    marginBottom: 2,
  },
  positionPnL: {
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 2,
  },
  currentPrice: {
    fontSize: 11,
    color: TabTheme.textMuted,
    fontWeight: "500",
  },
  errorState: {
    backgroundColor: "rgba(206, 77, 77, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(206, 77, 77, 0.3)",
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  errorText: {
    color: "#CE4D4D",
    fontSize: 12,
    fontWeight: "500",
  },
});
