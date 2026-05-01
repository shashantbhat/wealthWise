import { Typography } from "@/constants/theme";
import investmentsData from "@/data/investments.json";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Dimensions,
    Keyboard,
    Modal,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from "react-native";

const INVESTMENTS_FONT = "Inter";

const INVEST_THEME = {
  bg: "#FFFFFF",
  surface: "#FFFFFF",
  surfaceSoft: "#F7F8FA",
  surfaceMuted: "#FBFBFC",
  border: "#E6E8EE",
  borderStrong: "#D6DAE2",
  text: "#111111",
  textMuted: "#666666",
  textSoft: "#8A8A8A",
  accent: "#111111",
  accentSoft: "rgba(17, 17, 17, 0.08)",
  success: "#0B8F6A",
  shadow: "#000000",
};

function InvestText({ style, ...props }: React.ComponentProps<typeof Text>) {
  return <Text {...props} style={[{ fontFamily: INVESTMENTS_FONT }, style]} />;
}

// ─── SIP Calculator data ──────────────────────────────────────────────────────
const CALC_FUNDS = [
  {
    id: "index",
    name: "Index Funds",
    icon: "trending-up-outline",
    avgRate: 13,
    color: "#111111",
    risk: "Moderate",
  },
  {
    id: "flexi",
    name: "Flexi Cap Funds",
    icon: "swap-horizontal-outline",
    avgRate: 13,
    color: "#555555",
    risk: "Moderate-High",
  },
  {
    id: "debt",
    name: "Debt Funds",
    icon: "shield-checkmark-outline",
    avgRate: 7.5,
    color: "#777777",
    risk: "Low",
  },
  {
    id: "tbills",
    name: "T-Bills",
    icon: "document-outline",
    avgRate: 6.2,
    color: "#A0A0A0",
    risk: "Very Low",
  },
  {
    id: "smallcap",
    name: "Small Cap MF",
    icon: "rocket-outline",
    avgRate: 17,
    color: "#333333",
    risk: "High",
  },
  {
    id: "midcap",
    name: "Mid Cap Funds",
    icon: "bar-chart-outline",
    avgRate: 15,
    color: "#666666",
    risk: "Moderate-High",
  },
  {
    id: "largecap",
    name: "Large Cap MF",
    icon: "business-outline",
    avgRate: 12,
    color: "#888888",
    risk: "Low-Moderate",
  },
  {
    id: "govbonds",
    name: "Gov Bonds",
    icon: "shield-checkmark-outline",
    avgRate: 6.8,
    color: "#A8A8A8",
    risk: "Very Low",
  },
];

function calcSIP(p: number, rate: number, years: number) {
  if (!p || !years || !rate) return 0;
  const r = rate / 100 / 12,
    n = years * 12;
  return p * ((Math.pow(1 + r, n) - 1) / r) * (1 + r);
}
function calcLump(p: number, rate: number, years: number) {
  if (!p || !years || !rate) return 0;
  return p * Math.pow(1 + rate / 100, years);
}
function fmtAmt(v: number) {
  if (v >= 1e7) return `₹${(v / 1e7).toFixed(2)} Cr`;
  if (v >= 1e5) return `₹${(v / 1e5).toFixed(2)} L`;
  return `₹${Math.round(v).toLocaleString("en-IN")}`;
}

function formatCompactINR(amount: number) {
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

function SIPCalculator() {
  const [mode, setMode] = useState<"sip" | "lump">("sip");
  const [amount, setAmount] = useState("");
  const [years, setYears] = useState("");
  const [fundId, setFundId] = useState("index");
  const [open, setOpen] = useState(false);

  const fund = CALC_FUNDS.find((f) => f.id === fundId)!;
  const amt = parseFloat(amount.replace(/,/g, "")) || 0;
  const yrs = parseFloat(years) || 0;
  const fv =
    mode === "sip"
      ? calcSIP(amt, fund.avgRate, yrs)
      : calcLump(amt, fund.avgRate, yrs);
  const invested = mode === "sip" ? amt * yrs * 12 : amt;
  const gains = fv - invested;
  const hasResult = amt > 0 && yrs > 0;

  return (
    <View style={calcS.card}>
      <View style={calcS.titleRow}>
        <Ionicons name="calculator" size={19} color={INVEST_THEME.text} />
        <InvestText style={calcS.title}>Investment Calculator</InvestText>
      </View>

      {/* SIP / Lump Sum toggle */}
      <View style={calcS.toggle}>
        <TouchableOpacity
          style={[calcS.tBtn, mode === "sip" && calcS.tOn]}
          onPress={() => setMode("sip")}
        >
          <InvestText style={[calcS.tTxt, mode === "sip" && calcS.tOnTxt]}>
            Monthly SIP
          </InvestText>
        </TouchableOpacity>
        <TouchableOpacity
          style={[calcS.tBtn, mode === "lump" && calcS.tOn]}
          onPress={() => setMode("lump")}
        >
          <InvestText style={[calcS.tTxt, mode === "lump" && calcS.tOnTxt]}>
            Lump Sum
          </InvestText>
        </TouchableOpacity>
      </View>

      {/* Amount */}
      <InvestText style={calcS.label}>
        {mode === "sip" ? "Monthly SIP Amount" : "Lump Sum Amount"}
      </InvestText>
      <View style={calcS.inputRow}>
        <InvestText style={calcS.prefix}>₹</InvestText>
        <TextInput
          style={calcS.input}
          keyboardType="numeric"
          placeholder={mode === "sip" ? "5,000" : "1,00,000"}
          placeholderTextColor={INVEST_THEME.textSoft}
          value={amount}
          onChangeText={setAmount}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
      </View>

      {/* Instrument */}
      <InvestText style={[calcS.label, { marginTop: 12 }]}>
        Instrument
      </InvestText>
      <TouchableOpacity
        style={[calcS.selector, { borderColor: fund.color + "88" }]}
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.85}
      >
        <View style={[calcS.sIcon, { backgroundColor: fund.color + "22" }]}>
          <Ionicons
            name={fund.icon as React.ComponentProps<typeof Ionicons>["name"]}
            size={15}
            color={fund.color}
          />
        </View>
        <View style={{ flex: 1 }}>
          <InvestText style={[calcS.sName, { color: fund.color }]}>
            {fund.name}
          </InvestText>
          <InvestText style={calcS.sRate}>
            ~{fund.avgRate}% avg · {fund.risk} risk
          </InvestText>
        </View>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={15}
          color={INVEST_THEME.textSoft}
        />
      </TouchableOpacity>

      {open && (
        <View style={calcS.dropdown}>
          {CALC_FUNDS.map((f) => (
            <TouchableOpacity
              key={f.id}
              style={[
                calcS.ddRow,
                f.id === fundId && { backgroundColor: f.color + "15" },
              ]}
              onPress={() => {
                setFundId(f.id);
                setOpen(false);
              }}
              activeOpacity={0.8}
            >
              <View style={[calcS.ddIcon, { backgroundColor: f.color + "22" }]}>
                <Ionicons
                  name={f.icon as React.ComponentProps<typeof Ionicons>["name"]}
                  size={13}
                  color={f.color}
                />
              </View>
              <InvestText style={calcS.ddName}>{f.name}</InvestText>
              <InvestText style={[calcS.ddRate, { color: f.color }]}>
                ~{f.avgRate}%
              </InvestText>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Years */}
      <InvestText style={[calcS.label, { marginTop: 12 }]}>
        Time Horizon
      </InvestText>
      <View style={calcS.inputRow}>
        <TextInput
          style={[calcS.input, { flex: 1 }]}
          keyboardType="numeric"
          placeholder="10"
          placeholderTextColor={INVEST_THEME.textSoft}
          value={years}
          onChangeText={setYears}
          returnKeyType="done"
          onSubmitEditing={Keyboard.dismiss}
        />
        <InvestText style={calcS.suffix}>years</InvestText>
      </View>

      {/* Result */}
      {hasResult ? (
        <View
          style={[
            calcS.result,
            {
              borderColor: fund.color + "55",
              backgroundColor: fund.color + "0D",
            },
          ]}
        >
          <InvestText style={calcS.resultSub}>
            {mode === "sip"
              ? `${formatCompactINR(amt)}/mo`
              : `${formatCompactINR(amt)} lumpsum`}{" "}
            in {fund.name} for {yrs}y
          </InvestText>
          <InvestText style={[calcS.resultAmt, { color: fund.color }]}>
            {fmtAmt(fv)}
          </InvestText>
          <View style={calcS.grid}>
            <View style={calcS.cell}>
              <InvestText style={calcS.cellL}>Invested</InvestText>
              <InvestText style={calcS.cellV}>{fmtAmt(invested)}</InvestText>
            </View>
            <View style={calcS.vline} />
            <View style={calcS.cell}>
              <InvestText style={calcS.cellL}>Est. Gains</InvestText>
              <InvestText
                style={[calcS.cellV, { color: INVEST_THEME.success }]}
              >
                {fmtAmt(gains)}
              </InvestText>
            </View>
            <View style={calcS.vline} />
            <View style={calcS.cell}>
              <InvestText style={calcS.cellL}>Returns</InvestText>
              <InvestText
                style={[calcS.cellV, { color: INVEST_THEME.success }]}
              >
                {invested > 0
                  ? `${((gains / invested) * 100).toFixed(0)}%`
                  : "--"}
              </InvestText>
            </View>
          </View>
        </View>
      ) : (
        <View style={calcS.empty}>
          <InvestText style={calcS.emptyTxt}>
            Enter amount, pick an instrument & time horizon
          </InvestText>
        </View>
      )}
    </View>
  );
}

const calcS = StyleSheet.create({
  card: {
    backgroundColor: INVEST_THEME.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: INVEST_THEME.border,
    padding: 18,
    marginBottom: 20,
    shadowColor: INVEST_THEME.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  title: { ...Typography.h6, fontWeight: "900", color: INVEST_THEME.text },
  toggle: {
    flexDirection: "row",
    backgroundColor: INVEST_THEME.surfaceSoft,
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  tBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  tOn: { backgroundColor: INVEST_THEME.text },
  tTxt: { ...Typography.label, color: INVEST_THEME.textSoft },
  tOnTxt: { color: "#FFF" },
  label: {
    ...Typography.hint,
    color: INVEST_THEME.textSoft,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INVEST_THEME.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: INVEST_THEME.border,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  prefix: { ...Typography.h5, color: INVEST_THEME.text, marginRight: 4 },
  suffix: {
    ...Typography.bodySmall,
    color: INVEST_THEME.textSoft,
    marginLeft: 6,
  },
  input: {
    flex: 1,
    ...Typography.h5,
    color: INVEST_THEME.text,
    padding: 0,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: INVEST_THEME.surfaceMuted,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
  },
  sIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sName: { ...Typography.h6 },
  sRate: { ...Typography.caption, color: INVEST_THEME.textSoft, marginTop: 1 },
  dropdown: {
    marginTop: 4,
    backgroundColor: INVEST_THEME.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: INVEST_THEME.border,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  ddRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: INVEST_THEME.border,
  },
  ddIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  ddName: { flex: 1, ...Typography.label, color: INVEST_THEME.text },
  ddRate: { ...Typography.labelSmall },
  result: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 14 },
  resultSub: {
    ...Typography.caption,
    color: INVEST_THEME.textSoft,
    marginBottom: 2,
  },
  resultAmt: {
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 12,
    letterSpacing: -0.4,
  },
  grid: { flexDirection: "row" },
  cell: { flex: 1, alignItems: "center" },
  cellL: { ...Typography.hint, color: INVEST_THEME.textSoft, marginBottom: 3 },
  cellV: { ...Typography.label, color: INVEST_THEME.text },
  vline: {
    width: 1,
    backgroundColor: INVEST_THEME.border,
    marginHorizontal: 6,
  },
  empty: {
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: INVEST_THEME.border,
    marginTop: 14,
  },
  emptyTxt: {
    ...Typography.label,
    color: INVEST_THEME.textSoft,
    textAlign: "center",
  },
});

const { width: SW } = Dimensions.get("window");

type Investment = (typeof investmentsData.investment_options)[number];

// ─── Risk bar ─────────────────────────────────────────────────────────────────
function RiskBar({ score, color }: { score: number; color: string }) {
  return (
    <View style={riskStyles.row}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            riskStyles.dot,
            { backgroundColor: i <= score ? color : "#E0E0E0" },
          ]}
        />
      ))}
    </View>
  );
}
const riskStyles = StyleSheet.create({
  row: { flexDirection: "row", gap: 5, marginTop: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
});

// ─── Volatility visual ────────────────────────────────────────────────────────
function VolatilityHint({ riskScore }: { riskScore: number }) {
  const isHigh = riskScore >= 3;
  return (
    <View style={volStyles.container}>
      <InvestText style={volStyles.label}>Volatility</InvestText>
      <View style={volStyles.lineRow}>
        {isHigh ? (
          // Wavy line for high volatility
          <InvestText style={volStyles.wave}>〜〜〜〜〜〜〜〜</InvestText>
        ) : (
          // Smooth for low
          <View style={volStyles.smoothLine} />
        )}
      </View>
      <InvestText style={volStyles.hint}>
        {isHigh
          ? "Expect bumps along the way — worth it long term."
          : "Smooth, predictable growth."}
      </InvestText>
    </View>
  );
}
const volStyles = StyleSheet.create({
  container: {
    backgroundColor: INVEST_THEME.surfaceMuted,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: INVEST_THEME.border,
  },
  label: {
    ...Typography.labelSmall,
    color: INVEST_THEME.textSoft,
    marginBottom: 8,
  },
  lineRow: { justifyContent: "center", marginBottom: 6 },
  wave: { ...Typography.h5, color: INVEST_THEME.text, letterSpacing: 2 },
  smoothLine: {
    height: 3,
    backgroundColor: INVEST_THEME.text,
    borderRadius: 2,
  },
  hint: {
    ...Typography.labelSmall,
    color: INVEST_THEME.textMuted,
    fontStyle: "italic",
  },
});

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function InvestmentDetail({
  item,
  onClose,
}: {
  item: Investment;
  onClose: () => void;
}) {
  const rule72 = (
    72 /
    ((item.expected_return_min + item.expected_return_max) / 2)
  ).toFixed(1);

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <View style={dStyles.overlay}>
        <View style={dStyles.sheet}>
          {/* Header */}
          <View
            style={[
              dStyles.headerBar,
              { borderBottomColor: item.color + "55" },
            ]}
          >
            <View
              style={[dStyles.iconBg, { backgroundColor: item.color + "22" }]}
            >
              <Ionicons
                name={
                  item.icon as React.ComponentProps<typeof Ionicons>["name"]
                }
                size={26}
                color={item.color}
              />
            </View>
            <View style={{ flex: 1 }}>
              <InvestText style={dStyles.title}>{item.title}</InvestText>
              <InvestText style={dStyles.tagline}>{item.tagline}</InvestText>
            </View>
            <TouchableOpacity onPress={onClose} style={dStyles.closeBtn}>
              <Ionicons name="close" size={22} color={INVEST_THEME.text} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            {/* Stats row */}
            <View style={dStyles.statsRow}>
              <View
                style={[dStyles.statBox, { borderColor: item.color + "44" }]}
              >
                <InvestText style={[dStyles.statValue, { color: item.color }]}>
                  {item.expected_return_label}
                </InvestText>
                <InvestText style={dStyles.statLabel}>
                  Expected Return
                </InvestText>
              </View>
              <View
                style={[dStyles.statBox, { borderColor: item.color + "44" }]}
              >
                <InvestText style={[dStyles.statValue, { color: item.color }]}>
                  {item.ideal_horizon}
                </InvestText>
                <InvestText style={dStyles.statLabel}>Ideal Horizon</InvestText>
              </View>
            </View>

            {/* Risk bar */}
            <View style={dStyles.section}>
              <InvestText style={dStyles.sectionTitle}>Risk Level</InvestText>
              <View
                style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
              >
                <RiskBar score={item.risk_score} color={item.color} />
                <InvestText style={[dStyles.riskLabel, { color: item.color }]}>
                  {item.risk}
                </InvestText>
              </View>
            </View>

            {/* Projection card */}
            <View
              style={[
                dStyles.projectionCard,
                {
                  borderColor: item.color + "55",
                  backgroundColor: item.color + "11",
                },
              ]}
            >
              <InvestText style={dStyles.projectionHeading}>
                💡 If you invest
              </InvestText>
              <InvestText
                style={[dStyles.projectionAmount, { color: item.color }]}
              >
                ₹{item.sample_projection.monthly.toLocaleString("en-IN")}/mo
              </InvestText>
              <InvestText style={dStyles.projectionFor}>
                for {item.sample_projection.years} years, you'd likely have
              </InvestText>
              <InvestText
                style={[dStyles.projectionResult, { color: item.color }]}
              >
                ₹{item.sample_projection.result} Lakhs
              </InvestText>
              <InvestText style={dStyles.projectionNote}>
                At {item.expected_return_label} CAGR (estimate)
              </InvestText>
            </View>

            {/* Rule of 72 */}
            <View style={dStyles.section}>
              <InvestText style={dStyles.sectionTitle}>
                ⚡ Rule of 72
              </InvestText>
              <View style={dStyles.rule72Card}>
                <InvestText style={dStyles.rule72Text}>
                  At this return rate, your money{" "}
                  <InvestText
                    style={{ fontWeight: "700", color: INVEST_THEME.text }}
                  >
                    doubles
                  </InvestText>{" "}
                  in approximately
                </InvestText>
                <InvestText
                  style={[dStyles.rule72Years, { color: item.color }]}
                >
                  {rule72} years
                </InvestText>
                <InvestText style={dStyles.rule72Formula}>
                  72 ÷{" "}
                  {(
                    (item.expected_return_min + item.expected_return_max) /
                    2
                  ).toFixed(0)}
                  % = {rule72} years
                </InvestText>
              </View>
            </View>

            {/* Volatility */}
            <VolatilityHint riskScore={item.risk_score} />

            {/* What it invests in */}
            <View style={dStyles.section}>
              <InvestText style={dStyles.sectionTitle}>
                What's Inside
              </InvestText>
              <InvestText style={dStyles.bodyText}>
                {item.what_it_invests_in}
              </InvestText>
              <View style={dStyles.examplesRow}>
                {item.examples.map((ex) => (
                  <View
                    key={ex}
                    style={[
                      dStyles.exampleChip,
                      { borderColor: item.color + "55" },
                    ]}
                  >
                    <InvestText
                      style={[dStyles.exampleChipText, { color: item.color }]}
                    >
                      {ex}
                    </InvestText>
                  </View>
                ))}
              </View>
            </View>

            {/* Logic */}
            <View style={dStyles.section}>
              <InvestText style={dStyles.sectionTitle}>How It Works</InvestText>
              <InvestText style={dStyles.bodyText}>{item.logic}</InvestText>
            </View>

            {/* Features */}
            <View style={dStyles.section}>
              <InvestText style={dStyles.sectionTitle}>Key Features</InvestText>
              <View style={dStyles.featuresCard}>
                {Array.isArray((item as any).features) &&
                  (item as any).features.map((feat: string, idx: number) => (
                    <View key={idx} style={dStyles.featureRow}>
                      <View
                        style={[
                          dStyles.featureDot,
                          { backgroundColor: item.color },
                        ]}
                      />
                      <InvestText style={dStyles.featureText}>
                        {feat}
                      </InvestText>
                    </View>
                  ))}
              </View>
            </View>

            {/* Tax note */}
            <View style={dStyles.taxCard}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <Ionicons
                  name="receipt-outline"
                  size={16}
                  color={INVEST_THEME.text}
                />
                <InvestText style={dStyles.taxTitle}>Tax Wise Note</InvestText>
              </View>
              <InvestText style={dStyles.taxText}>{item.tax_note}</InvestText>
            </View>

            <View style={{ height: 32 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const dStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.22)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: INVEST_THEME.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: "90%",
    paddingBottom: 0,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 20,
    borderBottomWidth: 1,
  },
  iconBg: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  title: { ...Typography.h5, fontWeight: "900", color: INVEST_THEME.text },
  tagline: {
    ...Typography.labelSmall,
    color: INVEST_THEME.textSoft,
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: INVEST_THEME.surfaceSoft,
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: { flexDirection: "row", gap: 12, padding: 16, paddingBottom: 4 },
  statBox: {
    flex: 1,
    backgroundColor: INVEST_THEME.surfaceMuted,
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: INVEST_THEME.border,
  },
  statValue: { ...Typography.h6, fontWeight: "900" },
  statLabel: {
    ...Typography.caption,
    color: INVEST_THEME.textSoft,
    marginTop: 4,
  },
  section: { paddingHorizontal: 16, paddingVertical: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: INVEST_THEME.textSoft,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  riskLabel: { ...Typography.label },
  projectionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  projectionHeading: {
    ...Typography.labelSmall,
    color: INVEST_THEME.textSoft,
    marginBottom: 4,
  },
  projectionAmount: { ...Typography.h2, fontWeight: "900" },
  projectionFor: {
    ...Typography.label,
    color: INVEST_THEME.textMuted,
    marginTop: 6,
  },
  projectionResult: {
    fontSize: 34,
    fontWeight: "900",
    marginTop: 4,
    fontFamily: "Inter",
  },
  projectionNote: {
    ...Typography.caption,
    color: INVEST_THEME.textSoft,
    marginTop: 6,
  },
  rule72Card: {
    backgroundColor: INVEST_THEME.surfaceMuted,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: INVEST_THEME.border,
    alignItems: "center",
  },
  rule72Text: {
    ...Typography.label,
    color: INVEST_THEME.textMuted,
    textAlign: "center",
  },
  rule72Years: {
    fontSize: 36,
    fontWeight: "900",
    marginVertical: 4,
    fontFamily: "Inter",
  },
  rule72Formula: {
    ...Typography.labelSmall,
    color: INVEST_THEME.textSoft,
    fontStyle: "italic",
  },
  bodyText: { ...Typography.bodySmall, color: INVEST_THEME.textMuted },
  examplesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  exampleChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: INVEST_THEME.surfaceMuted,
  },
  exampleChipText: { ...Typography.labelSmall },
  taxCard: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: INVEST_THEME.surfaceMuted,
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: INVEST_THEME.text,
  },
  taxTitle: { ...Typography.label, color: INVEST_THEME.text },
  taxText: { ...Typography.label, color: INVEST_THEME.textMuted },
  featuresCard: {
    backgroundColor: INVEST_THEME.surfaceMuted,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: INVEST_THEME.border,
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  featureDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 5,
    flexShrink: 0,
  },
  featureText: {
    flex: 1,
    fontSize: 13,
    color: INVEST_THEME.textMuted,
    lineHeight: 19,
  },
});

// ─── Investment Card (catalog) ─────────────────────────────────────────────────
function InvestmentCard({
  item,
  onPress,
}: {
  item: Investment;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[cardStyles.card, { borderColor: item.color + "55" }]}
      activeOpacity={0.8}
      onPress={onPress}
    >
      {/* Left accent bar */}
      <View style={[cardStyles.accentBar, { backgroundColor: item.color }]} />

      <View style={{ flex: 1 }}>
        {/* Title row */}
        <View style={cardStyles.titleRow}>
          <View
            style={[cardStyles.iconBox, { backgroundColor: item.color + "22" }]}
          >
            <Ionicons
              name={item.icon as React.ComponentProps<typeof Ionicons>["name"]}
              size={22}
              color={item.color}
            />
          </View>
          <View style={{ flex: 1 }}>
            <InvestText style={cardStyles.title}>{item.title}</InvestText>
            <InvestText style={cardStyles.tagline} numberOfLines={1}>
              {item.tagline}
            </InvestText>
          </View>
          <View
            style={[
              cardStyles.returnBadge,
              { backgroundColor: item.color + "18" },
            ]}
          >
            <InvestText style={[cardStyles.returnText, { color: item.color }]}>
              {item.expected_return_label}
            </InvestText>
          </View>
        </View>

        {/* Meta row */}
        <View style={cardStyles.metaRow}>
          <View style={cardStyles.metaItem}>
            <InvestText style={cardStyles.metaLabel}>Risk</InvestText>
            <RiskBar score={item.risk_score} color={item.color} />
          </View>
          <View style={cardStyles.metaItem}>
            <InvestText style={cardStyles.metaLabel}>Horizon</InvestText>
            <InvestText style={[cardStyles.metaValue, { color: item.color }]}>
              {item.ideal_horizon}
            </InvestText>
          </View>
          <View style={cardStyles.metaItem}>
            <InvestText style={cardStyles.metaLabel}>Best for</InvestText>
            <InvestText style={cardStyles.metaValue} numberOfLines={1}>
              {item.best_for}
            </InvestText>
          </View>
        </View>
      </View>

      <Ionicons
        name="chevron-forward"
        size={16}
        color={INVEST_THEME.textSoft}
        style={{ alignSelf: "center" }}
      />
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: INVEST_THEME.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: INVEST_THEME.border,
    marginBottom: 14,
    overflow: "hidden",
    paddingRight: 14,
    paddingVertical: 16,
    shadowColor: INVEST_THEME.shadow,
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 1,
  },
  accentBar: {
    width: 4,
    borderRadius: 2,
    marginRight: 14,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    ...Typography.bodyMedium,
    fontWeight: "900",
    color: INVEST_THEME.text,
  },
  tagline: {
    ...Typography.caption,
    color: INVEST_THEME.textSoft,
    marginTop: 2,
  },
  returnBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  returnText: { ...Typography.labelSmall, fontWeight: "900" },
  metaRow: { flexDirection: "row", gap: 0 },
  metaItem: { flex: 1 },
  metaLabel: {
    fontSize: 10,
    color: INVEST_THEME.textSoft,
    fontWeight: "600",
    marginBottom: 4,
  },
  metaValue: { ...Typography.labelSmall, color: INVEST_THEME.textMuted },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function InvestmentsScreen() {
  const [selected, setSelected] = useState<Investment | null>(null);
  const investments = investmentsData.investment_options;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={INVEST_THEME.bg} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <InvestText style={styles.headerTitle}>Invest</InvestText>
          <InvestText style={styles.headerSub}>
            Grow your wealth intelligently
          </InvestText>
        </View>

        {/* Calculator */}
        <SIPCalculator />

        {/* Quick legend */}
        <View style={styles.legendRow}>
          {[
            { label: "Low Risk", color: INVEST_THEME.text },
            { label: "Moderate", color: INVEST_THEME.textMuted },
            { label: "High Risk", color: INVEST_THEME.textSoft },
          ].map(({ label, color }) => (
            <View key={label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: color }]} />
              <InvestText style={styles.legendText}>{label}</InvestText>
            </View>
          ))}
        </View>

        {/* Cards */}
        {investments.map((item) => (
          <InvestmentCard
            key={item.id}
            item={item}
            onPress={() => setSelected(item)}
          />
        ))}

        {/* Disclaimer */}
        <InvestText style={styles.disclaimer}>
          Returns shown are historical estimates. Investments are subject to
          market risk. Please read all scheme documents carefully.
        </InvestText>
      </ScrollView>

      {selected && (
        <InvestmentDetail item={selected} onClose={() => setSelected(null)} />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: INVEST_THEME.bg },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 20, paddingBottom: 8 },
  headerTitle: {
    fontSize: 34,
    fontWeight: "900",
    color: INVEST_THEME.text,
    letterSpacing: -0.4,
    fontFamily: "Inter",
  },
  headerSub: {
    ...Typography.bodySmall,
    color: INVEST_THEME.textMuted,
    marginTop: 4,
  },
  legendRow: {
    flexDirection: "row",
    gap: 16,
    marginVertical: 16,
    backgroundColor: INVEST_THEME.surfaceMuted,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: INVEST_THEME.border,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { ...Typography.labelSmall, color: INVEST_THEME.textMuted },
  disclaimer: {
    fontSize: 11,
    color: INVEST_THEME.textSoft,
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
    fontStyle: "italic",
  },
});
