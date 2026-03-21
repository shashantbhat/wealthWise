import { Fonts, TabTheme } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Keyboard,
    KeyboardAvoidingView,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

// ─── Fund definitions ─────────────────────────────────────────────────────────
type Fund = {
  id: string;
  name: string;
  tagline: string;
  icon: string;
  avgRate: number; // annual % (used in SIP formula)
  color: string;
  riskLabel: string;
  riskScore: number; // 1–5
  horizon: string;
  description: string;
};

const FUNDS: Fund[] = [
  {
    id: "index",
    name: "Index Funds",
    tagline: "Mirror the market. Simple, cheap, powerful.",
    icon: "trending-up-outline",
    avgRate: 13,
    color: "#4DABF7",
    riskLabel: "Moderate",
    riskScore: 2,
    horizon: "5+ Years",
    description:
      "Passively tracks Nifty 50 / Nifty 500. Ultra-low cost, historically outperforms 80% of active funds over 10+ years.",
  },
  {
    id: "flexi",
    name: "Flexi Cap Funds",
    tagline: "Freedom to invest across all market caps.",
    icon: "swap-horizontal-outline",
    avgRate: 13,
    color: "#A78BFA",
    riskLabel: "Moderate-High",
    riskScore: 3,
    horizon: "5+ Years",
    description:
      "Fund manager freely allocates between large, mid & small caps based on market conditions — best of all worlds.",
  },
  {
    id: "debt",
    name: "Debt Funds",
    tagline: "Stable returns with lower market risk.",
    icon: "shield-checkmark-outline",
    avgRate: 7.5,
    color: "#52B788",
    riskLabel: "Low",
    riskScore: 1,
    horizon: "2–3 Years",
    description:
      "Invests in government bonds, corporate bonds, and money-market instruments. Great for capital preservation.",
  },
  {
    id: "fd",
    name: "Fixed Deposits",
    tagline: "Guaranteed returns, zero market risk.",
    icon: "lock-closed-outline",
    avgRate: 6.5,
    color: "#F6C90E",
    riskLabel: "Very Low",
    riskScore: 1,
    horizon: "1–5 Years",
    description:
      "Bank-backed fixed-rate deposits. Safe, predictable, and ideal for short-term goals or emergency funds.",
  },
  {
    id: "smallcap",
    name: "Small Cap Funds",
    tagline: "High risk, high reward — for the bold.",
    icon: "rocket-outline",
    avgRate: 17,
    color: "#FF6B6B",
    riskLabel: "High",
    riskScore: 5,
    horizon: "10+ Years",
    description:
      "Bets on emerging high-growth companies before they become giants. Volatile short-term, transformative long-term.",
  },
  {
    id: "midcap",
    name: "Mid Cap Funds",
    tagline: "The sweet spot of growth & stability.",
    icon: "bar-chart-outline",
    avgRate: 15,
    color: "#FD7E14",
    riskLabel: "Moderate-High",
    riskScore: 4,
    horizon: "7+ Years",
    description:
      "Invests in medium-sized companies with strong expansion potential. Better returns than large caps, less chaos than small caps.",
  },
  {
    id: "largecap",
    name: "Large Cap Funds",
    tagline: "Blue-chip stability with consistent returns.",
    icon: "business-outline",
    avgRate: 12,
    color: "#20C997",
    riskLabel: "Low-Moderate",
    riskScore: 2,
    horizon: "5+ Years",
    description:
      "Invests in India's top 100 companies. Lower volatility, reliable growth — suitable for conservative investors.",
  },
  {
    id: "emerging",
    name: "Emerging Market Funds",
    tagline: "Ride the growth of rising economies.",
    icon: "globe-outline",
    avgRate: 13,
    color: "#E83E8C",
    riskLabel: "High",
    riskScore: 4,
    horizon: "7+ Years",
    description:
      "Invests across high-growth economies like India, China, Vietnam, and Brazil. High potential with currency & geopolitical risks.",
  },
  {
    id: "hybrid",
    name: "Hybrid Funds",
    tagline: "Best of both worlds — equity + debt.",
    icon: "git-merge-outline",
    avgRate: 11,
    color: "#10605A",
    riskLabel: "Moderate",
    riskScore: 3,
    horizon: "3–5 Years",
    description:
      "Balanced mix of equity and debt in one fund. Cushions downturns while still participating in market upside.",
  },
];

// ─── SIP formula (annuity due) ────────────────────────────────────────────────
// FV = P × [((1 + r)^n − 1) / r] × (1 + r)
// r = annual_rate / 12 / 100,  n = years × 12
function computeSIP(
  monthly: number,
  annualRate: number,
  years: number,
): number {
  if (monthly <= 0 || years <= 0 || annualRate <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return monthly * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}

// Lump sum: FV = P × (1 + r)^n, compounded annually
function computeLumpSum(
  principal: number,
  annualRate: number,
  years: number,
): number {
  if (principal <= 0 || years <= 0 || annualRate <= 0) return 0;
  return principal * Math.pow(1 + annualRate / 100, years);
}

function formatAmount(amount: number): string {
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`;
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(2)} L`;
  return `₹${Math.round(amount).toLocaleString("en-IN")}`;
}

// ─── Risk dots ────────────────────────────────────────────────────────────────
function RiskDots({ score, color }: { score: number; color: string }) {
  return (
    <View style={{ flexDirection: "row", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: i <= score ? color : "rgba(255,255,255,0.12)",
          }}
        />
      ))}
    </View>
  );
}

// ─── Top Calculator ───────────────────────────────────────────────────────────
function TopCalculator() {
  const [mode, setMode] = useState<"sip" | "lumpsum">("sip");
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState("");
  const [selectedId, setSelectedId] = useState("index");
  const [showPicker, setShowPicker] = useState(false);

  const fund = FUNDS.find((f) => f.id === selectedId)!;
  const amtNum = parseFloat(amount.replace(/,/g, "")) || 0;
  const yrsNum = parseFloat(years) || 0;
  const fv =
    mode === "sip"
      ? computeSIP(amtNum, fund.avgRate, yrsNum)
      : computeLumpSum(amtNum, fund.avgRate, yrsNum);
  const invested = mode === "sip" ? amtNum * yrsNum * 12 : amtNum;
  const gains = fv - invested;
  const hasResult = amtNum > 0 && yrsNum > 0;

  return (
    <View style={cs.card}>
      <View style={cs.titleRow}>
        <Ionicons name="calculator" size={20} color="#10605A" />
        <Text style={cs.title}>Investment Calculator</Text>
      </View>

      {/* Mode toggle */}
      <View style={cs.toggle}>
        <TouchableOpacity
          style={[cs.toggleBtn, mode === "sip" && cs.toggleOn]}
          onPress={() => setMode("sip")}
        >
          <Text style={[cs.toggleTxt, mode === "sip" && cs.toggleTxtOn]}>
            Monthly SIP
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[cs.toggleBtn, mode === "lumpsum" && cs.toggleOn]}
          onPress={() => setMode("lumpsum")}
        >
          <Text style={[cs.toggleTxt, mode === "lumpsum" && cs.toggleTxtOn]}>
            Lump Sum
          </Text>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <Text style={cs.label}>
        {mode === "sip" ? "Monthly SIP Amount" : "Lump Sum Amount"}
      </Text>
      <View style={cs.inputBox}>
        <Text style={cs.prefix}>₹</Text>
        <TextInput
          style={cs.input}
          keyboardType="numeric"
          placeholder={mode === "sip" ? "5,000" : "1,00,000"}
          placeholderTextColor="#9A9A9A"
          value={amount}
          onChangeText={setAmount}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>

      {/* Instrument selector */}
      <Text style={[cs.label, { marginTop: 14 }]}>Investment Instrument</Text>
      <TouchableOpacity
        style={[cs.selector, { borderColor: fund.color + "66" }]}
        onPress={() => setShowPicker((v) => !v)}
        activeOpacity={0.85}
      >
        <View style={[cs.sIcon, { backgroundColor: fund.color + "22" }]}>
          <Ionicons
            name={fund.icon as React.ComponentProps<typeof Ionicons>["name"]}
            size={16}
            color={fund.color}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[cs.sName, { color: fund.color }]}>{fund.name}</Text>
          <Text style={cs.sRate}>
            ~{fund.avgRate}% avg returns · {fund.riskLabel} risk
          </Text>
        </View>
        <Ionicons
          name={showPicker ? "chevron-up" : "chevron-down"}
          size={16}
          color="#888"
        />
      </TouchableOpacity>

      {showPicker && (
        <View style={cs.dropdown}>
          {FUNDS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                cs.ddItem,
                f.id === selectedId && { backgroundColor: f.color + "18" },
              ]}
              onPress={() => {
                setSelectedId(f.id);
                setShowPicker(false);
              }}
              activeOpacity={0.8}
            >
              <View style={[cs.ddIcon, { backgroundColor: f.color + "22" }]}>
                <Ionicons
                  name={f.icon as React.ComponentProps<typeof Ionicons>["name"]}
                  size={13}
                  color={f.color}
                />
              </View>
              <Text style={cs.ddName}>{f.name}</Text>
              <Text style={[cs.ddRate, { color: f.color }]}>~{f.avgRate}%</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Time horizon */}
      <Text style={[cs.label, { marginTop: 14 }]}>Time Horizon</Text>
      <View style={cs.inputBox}>
        <TextInput
          style={[cs.input, { flex: 1 }]}
          keyboardType="numeric"
          placeholder="10"
          placeholderTextColor="#9A9A9A"
          value={years}
          onChangeText={setYears}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        <Text style={cs.suffix}>years</Text>
      </View>

      {/* Result */}
      {hasResult ? (
        <View
          style={[
            cs.result,
            {
              borderColor: fund.color + "55",
              backgroundColor: fund.color + "0F",
            },
          ]}
        >
          <Text style={cs.resultSub}>
            {mode === "sip"
              ? `₹${amtNum.toLocaleString("en-IN")}/mo`
              : `₹${amtNum.toLocaleString("en-IN")} lumpsum`}{" "}
            in {fund.name} for {yrsNum}y
          </Text>
          <Text style={[cs.resultAmt, { color: fund.color }]}>
            {formatAmount(fv)}
          </Text>
          <View style={cs.resultRow}>
            <View style={cs.rcell}>
              <Text style={cs.rlabel}>Invested</Text>
              <Text style={cs.rval}>{formatAmount(invested)}</Text>
            </View>
            <View style={cs.rdiv} />
            <View style={cs.rcell}>
              <Text style={cs.rlabel}>Gains</Text>
              <Text style={[cs.rval, { color: "#4ADE80" }]}>
                {formatAmount(gains)}
              </Text>
            </View>
            <View style={cs.rdiv} />
            <View style={cs.rcell}>
              <Text style={cs.rlabel}>Returns</Text>
              <Text style={[cs.rval, { color: "#4ADE80" }]}>
                {invested > 0
                  ? `${((gains / invested) * 100).toFixed(0)}%`
                  : "—"}
              </Text>
            </View>
          </View>
        </View>
      ) : (
        <View style={cs.empty}>
          <Text style={cs.emptyTxt}>
            Fill in the fields above to see projected wealth
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Fund Info Card ───────────────────────────────────────────────────────────
function FundCard({ fund }: { fund: Fund }) {
  return (
    <View style={[fc.card, { borderColor: fund.color + "44" }]}>
      <View style={fc.row}>
        <View style={[fc.icon, { backgroundColor: fund.color + "22" }]}>
          <Ionicons
            name={fund.icon as React.ComponentProps<typeof Ionicons>["name"]}
            size={20}
            color={fund.color}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={fc.name}>{fund.name}</Text>
          <Text style={fc.tagline}>{fund.tagline}</Text>
        </View>
        <View style={fc.badge}>
          <Text style={[fc.badgeTxt, { color: fund.color }]}>
            ~{fund.avgRate}%
          </Text>
        </View>
      </View>
      <View style={fc.meta}>
        <View style={fc.chip}>
          <Ionicons name="time-outline" size={10} color="#8A8A8A" />
          <Text style={fc.chipTxt}>{fund.horizon}</Text>
        </View>
        <View style={fc.chip}>
          <Text style={fc.chipTxt}>{fund.riskLabel}</Text>
        </View>
        <RiskDots score={fund.riskScore} color={fund.color} />
      </View>
      <Text style={fc.desc}>{fund.description}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function FundExplorerScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: TabTheme.background }}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={TabTheme.background}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={{ padding: 20, paddingBottom: 48 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginBottom: 20, marginTop: 8 }}>
            <Text
              style={{
                fontSize: 28,
                fontWeight: "800",
                color: TabTheme.text,
                fontFamily: Fonts?.rounded ?? "normal",
                marginBottom: 4,
              }}
            >
              Fund Explorer
            </Text>
            <Text style={{ fontSize: 14, color: TabTheme.textMuted }}>
              Calculate returns, explore instruments.
            </Text>
          </View>

          <TopCalculator />

          <Text
            style={{
              fontSize: 16,
              fontWeight: "700",
              color: TabTheme.text,
              marginBottom: 12,
            }}
          >
            All Instruments
          </Text>

          {FUNDS.map((fund) => (
            <FundCard key={fund.id} fund={fund} />
          ))}

          <Text
            style={{
              fontSize: 11,
              color: "#8A8A8A",
              textAlign: "center",
              marginTop: 10,
              lineHeight: 16,
            }}
          >
            * Returns are historical averages. Mutual fund investments are
            subject to market risks.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const cs = StyleSheet.create({
  card: {
    backgroundColor: TabTheme.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(16,96,90,0.35)",
    padding: 18,
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  title: { fontSize: 17, fontWeight: "800", color: TabTheme.text },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#F4F4F4",
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  toggleOn: { backgroundColor: "#10605A" },
  toggleTxt: { fontSize: 13, fontWeight: "600", color: "#999" },
  toggleTxtOn: { color: "#FFF" },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9A9A9A",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TabTheme.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: TabTheme.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  prefix: { fontSize: 17, fontWeight: "700", color: "#10605A", marginRight: 4 },
  suffix: { fontSize: 14, color: "#9A9A9A", marginLeft: 6 },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: TabTheme.text,
    padding: 0,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: TabTheme.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  sIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sName: { fontSize: 14, fontWeight: "700" },
  sRate: { fontSize: 11, color: "#9A9A9A", marginTop: 1 },
  dropdown: {
    marginTop: 6,
    backgroundColor: TabTheme.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: TabTheme.border,
    overflow: "hidden",
  },
  ddItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: TabTheme.border,
  },
  ddIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  ddName: { flex: 1, fontSize: 13, color: TabTheme.text, fontWeight: "600" },
  ddRate: { fontSize: 12, fontWeight: "700" },
  result: { borderRadius: 14, borderWidth: 1, padding: 16, marginTop: 14 },
  resultSub: { fontSize: 11, color: "#9A9A9A", marginBottom: 4 },
  resultAmt: { fontSize: 34, fontWeight: "800", marginBottom: 16 },
  resultRow: { flexDirection: "row" },
  rcell: { flex: 1, alignItems: "center" },
  rlabel: { fontSize: 10, color: "#9A9A9A", marginBottom: 3 },
  rval: { fontSize: 14, fontWeight: "700", color: TabTheme.text },
  rdiv: { width: 1, backgroundColor: TabTheme.border, marginHorizontal: 6 },
  empty: {
    padding: 18,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: TabTheme.border,
    marginTop: 14,
  },
  emptyTxt: { fontSize: 13, color: "#9A9A9A", textAlign: "center" },
});

const fc = StyleSheet.create({
  card: {
    backgroundColor: TabTheme.surface,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  name: {
    fontSize: 15,
    fontWeight: "700",
    color: TabTheme.text,
    marginBottom: 2,
  },
  tagline: { fontSize: 11, color: "#8A8A8A" },
  badge: {
    backgroundColor: "#F3F3F3",
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeTxt: { fontSize: 12, fontWeight: "700" },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 10,
    flexWrap: "wrap",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#F5F5F5",
    borderRadius: 5,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  chipTxt: { fontSize: 10, color: "#8A8A8A" },
  desc: { fontSize: 12, color: "#8A8A8A", marginTop: 9, lineHeight: 18 },
});
