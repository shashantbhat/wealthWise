import { DhanHolding, fetchDhanHoldings } from "@/app/utils/dhanApi";
import { TabTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
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

export default function PortfolioScreen() {
  const [apiKey, setApiKey] = useState("");
  const [connected, setConnected] = useState(false);
  const [hideKey, setHideKey] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [holdings, setHoldings] = useState<Holding[]>([]);

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
