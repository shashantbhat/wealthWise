import quotesData from "@/data/quotes.json";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { formatINR } from "./constants";
import { RING_SIZE, RingChart } from "./RingChart";

function getRandomQuote(): string {
  const allQuotes = quotesData.wealth_advice_quotes.flatMap(
    (category) => category.quotes,
  );
  return allQuotes[Math.floor(Math.random() * allQuotes.length)];
}

type Props = {
  progress: number;
  percentage: number;
  totalLocalSpent: number;
  effectiveBudget: number;
  isOverBudget: boolean;
  hideAmounts: boolean;
  onToggleHide: () => void;
};

export function SpendingRingSection({
  progress,
  percentage,
  totalLocalSpent,
  effectiveBudget,
  isOverBudget,
  hideAmounts,
  onToggleHide,
}: Props) {
  const displayAmount = (amount: number) =>
    hideAmounts ? "₹ ----" : formatINR(amount);

  return (
    <View style={styles.ringSection}>
      <View style={styles.ringTitleRow}>
        <Text style={styles.ringTitle}>
          {new Date().toLocaleDateString("en-US", { month: "long" })}
        </Text>
        <TouchableOpacity style={styles.hideToggleBtn} onPress={onToggleHide}>
          <Ionicons
            name={hideAmounts ? "eye-outline" : "eye-off-outline"}
            size={18}
            color="#666666"
          />
        </TouchableOpacity>
      </View>

      <View style={styles.ringWrapper}>
        <RingChart progress={progress} />
        <View style={styles.ringCenter}>
          <Text
            style={[
              styles.ringPct,
              { color: isOverBudget ? "#555555" : "#1A1A1A" },
            ]}
          >
            {percentage}%
          </Text>
          <Text style={styles.percentageLabel}>Spent</Text>
          <Text style={styles.ringSpentAmt}>
            {displayAmount(totalLocalSpent)}
          </Text>
          <Text style={styles.ringSubText}>
            of {displayAmount(effectiveBudget)}
          </Text>
        </View>
      </View>

      {isOverBudget && (
        <View style={styles.overBudgetBadge}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Ionicons name="warning-outline" size={14} color="#555555" />
            <Text style={styles.overBudgetText}>Over budget this month</Text>
          </View>
        </View>
      )}

      <View style={styles.quoteContainer}>
        <Text style={styles.quoteText}>&#34;{getRandomQuote()}&#34;</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ringSection: {
    alignItems: "center",
    marginTop: 28,
    marginBottom: 4,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  ringTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
    gap: 12,
  },
  ringTitle: {
    color: "#666666",
    fontSize: 14,
    letterSpacing: 0.6,
  },
  hideToggleBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#F5F5F5",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringPct: {
    fontSize: 38,
    fontWeight: "800",
    lineHeight: 44,
    color: "#1A1A1A",
  },
  percentageLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666666",
    marginTop: -2,
    letterSpacing: 0.5,
  },
  ringSpentAmt: {
    color: "#1A1A1A",
    fontSize: 17,
    fontWeight: "600",
    marginTop: 2,
  },
  ringSubText: { color: "#999999", fontSize: 12, marginTop: 2 },
  overBudgetBadge: {
    marginTop: 14,
    backgroundColor: "rgba(0,0,0,0.06)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  overBudgetText: { color: "#555555", fontSize: 13, fontWeight: "600" },
  quoteContainer: {
    marginTop: 18,
    marginHorizontal: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  quoteText: {
    fontSize: 13,
    fontStyle: "italic",
    color: "#555555",
    lineHeight: 18,
    fontWeight: "500",
    textAlign: "center",
  },
});
