import investmentsData from "@/data/investments.json";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Dimensions,
    Keyboard,
    Modal,
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

const INVESTMENTS_FONT = Platform.select({
  ios: "SF Pro Text",
  android: "sans-serif",
  default: "System",
});

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
    color: "#4DABF7",
    risk: "Moderate",
  },
  {
    id: "flexi",
    name: "Flexi Cap Funds",
    icon: "swap-horizontal-outline",
    avgRate: 13,
    color: "#A78BFA",
    risk: "Moderate-High",
  },
  {
    id: "debt",
    name: "Debt Funds",
    icon: "shield-checkmark-outline",
    avgRate: 7.5,
    color: "#52B788",
    risk: "Low",
  },
  {
    id: "tbills",
    name: "T-Bills",
    icon: "document-outline",
    avgRate: 6.2,
    color: "#FF9500",
    risk: "Very Low",
  },
  {
    id: "smallcap",
    name: "Small Cap MF",
    icon: "rocket-outline",
    avgRate: 17,
    color: "#FF6B6B",
    risk: "High",
  },
  {
    id: "midcap",
    name: "Mid Cap Funds",
    icon: "bar-chart-outline",
    avgRate: 15,
    color: "#FD7E14",
    risk: "Moderate-High",
  },
  {
    id: "largecap",
    name: "Large Cap MF",
    icon: "business-outline",
    avgRate: 12,
    color: "#20C997",
    risk: "Low-Moderate",
  },
  {
    id: "govbonds",
    name: "Gov Bonds",
    icon: "shield-checkmark-outline",
    avgRate: 6.8,
    color: "#6C63FF",
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
        <Ionicons name="calculator" size={20} color="black" />
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
          placeholderTextColor="#BBB"
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
          color="#AAA"
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
          placeholderTextColor="#BBB"
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
              ? `₹${amt.toLocaleString("en-IN")}/mo`
              : `₹${amt.toLocaleString("en-IN")} lumpsum`}{" "}
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
              <InvestText style={[calcS.cellV, { color: "#00C853" }]}>
                {fmtAmt(gains)}
              </InvestText>
            </View>
            <View style={calcS.vline} />
            <View style={calcS.cell}>
              <InvestText style={calcS.cellL}>Returns</InvestText>
              <InvestText style={[calcS.cellV, { color: "#00C853" }]}>
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
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#10605A",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  title: { fontSize: 16, fontWeight: "800", color: "#1A1A1A" },
  toggle: {
    flexDirection: "row",
    backgroundColor: "#F4F4F4",
    borderRadius: 10,
    padding: 3,
    marginBottom: 14,
  },
  tBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: "center" },
  tOn: { backgroundColor: "#1A1A1A" },
  tTxt: { fontSize: 13, fontWeight: "600", color: "#999" },
  tOnTxt: { color: "#FFF" },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "black",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E8E8E8",
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  prefix: { fontSize: 17, fontWeight: "700", color: "#1A1A1A", marginRight: 4 },
  suffix: { fontSize: 14, color: "#AAA", marginLeft: 6 },
  input: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    color: "#1A1A1A",
    padding: 0,
  },
  selector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F7F7F7",
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
  sName: { fontSize: 14, fontWeight: "700" },
  sRate: { fontSize: 11, color: "#AAA", marginTop: 1 },
  dropdown: {
    marginTop: 4,
    backgroundColor: "#FFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EEE",
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
    borderBottomColor: "#F0F0F0",
  },
  ddIcon: {
    width: 26,
    height: 26,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  ddName: { flex: 1, fontSize: 13, color: "#1A1A1A", fontWeight: "600" },
  ddRate: { fontSize: 12, fontWeight: "700" },
  result: { borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 14 },
  resultSub: { fontSize: 11, color: "#AAA", marginBottom: 2 },
  resultAmt: { fontSize: 32, fontWeight: "800", marginBottom: 12 },
  grid: { flexDirection: "row" },
  cell: { flex: 1, alignItems: "center" },
  cellL: { fontSize: 10, color: "#AAA", marginBottom: 3 },
  cellV: { fontSize: 13, fontWeight: "700", color: "#1A1A1A" },
  vline: { width: 1, backgroundColor: "#EEE", marginHorizontal: 6 },
  empty: {
    padding: 16,
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#DDD",
    marginTop: 14,
  },
  emptyTxt: { fontSize: 13, color: "#BBB", textAlign: "center" },
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
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.3)",
  },
  label: { fontSize: 12, fontWeight: "700", color: "#999", marginBottom: 8 },
  lineRow: { justifyContent: "center", marginBottom: 6 },
  wave: { fontSize: 18, color: "#FF6B6B", letterSpacing: 2 },
  smoothLine: {
    height: 3,
    backgroundColor: "#00C853",
    borderRadius: 2,
  },
  hint: { fontSize: 12, color: "#777", fontStyle: "italic" },
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
              <Ionicons name="close" size={22} color="#666" />
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
                  <InvestText style={{ fontWeight: "700", color: "#1A1A1A" }}>
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
                <Ionicons name="receipt-outline" size={16} color="#10605A" />
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
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#F8F8F8",
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
  title: { fontSize: 18, fontWeight: "800", color: "#1A1A1A" },
  tagline: { fontSize: 12, color: "#777", marginTop: 2 },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F0F0F0",
    justifyContent: "center",
    alignItems: "center",
  },
  statsRow: { flexDirection: "row", gap: 12, padding: 16, paddingBottom: 4 },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.6)",
    borderRadius: 14,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: { fontSize: 16, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#888", marginTop: 4, fontWeight: "500" },
  section: { paddingHorizontal: 16, paddingVertical: 10 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#999",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  riskLabel: { fontSize: 13, fontWeight: "700" },
  projectionCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
  },
  projectionHeading: { fontSize: 12, color: "#888", marginBottom: 4 },
  projectionAmount: { fontSize: 28, fontWeight: "900" },
  projectionFor: { fontSize: 13, color: "#666", marginTop: 6 },
  projectionResult: { fontSize: 34, fontWeight: "900", marginTop: 4 },
  projectionNote: { fontSize: 11, color: "#999", marginTop: 6 },
  rule72Card: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center",
  },
  rule72Text: { fontSize: 13, color: "#555", textAlign: "center" },
  rule72Years: { fontSize: 36, fontWeight: "900", marginVertical: 4 },
  rule72Formula: { fontSize: 12, color: "#999", fontStyle: "italic" },
  bodyText: { fontSize: 14, color: "#444", lineHeight: 20 },
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
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  exampleChipText: { fontSize: 12, fontWeight: "600" },
  taxCard: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 8,
    backgroundColor: "#FFF8F0",
    borderRadius: 12,
    padding: 14,
    borderLeftWidth: 4,
    borderLeftColor: "#10605A",
  },
  taxTitle: { fontSize: 13, fontWeight: "700", color: "#10605A" },
  taxText: { fontSize: 13, color: "#555", lineHeight: 18 },
  featuresCard: {
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 12,
    padding: 14,
    borderWidth: 0.5,
    borderColor: "rgba(0,0,0,0.08)",
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
    color: "#444",
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
          <Ionicons
            name="chevron-forward"
            size={16}
            color="#CCC"
            style={{ alignSelf: "center" }}
          />
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

      {/* <Ionicons
        name="chevron-forward"
        size={16}
        color="#CCC"
        style={{ alignSelf: "center" }}
      /> */}
    </TouchableOpacity>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "rgba(255,255,255,0.55)",
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 14,
    overflow: "hidden",
    paddingRight: 14,
    paddingVertical: 16,
  },
  accentBar: {
    // width: 4,
    // borderRadius: 2,
    marginRight: 14,
    // borderTopLeftRadius: 18,
    // borderBottomLeftRadius: 18,
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
  title: { fontSize: 15, fontWeight: "800", color: "#1A1A1A" },
  tagline: { fontSize: 11, color: "#888", marginTop: 2 },
  returnBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  returnText: { fontSize: 12, fontWeight: "800" },
  metaRow: { flexDirection: "row", gap: 0 },
  metaItem: { flex: 1 },
  metaLabel: {
    fontSize: 10,
    color: "#AAA",
    fontWeight: "600",
    marginBottom: 4,
  },
  metaValue: { fontSize: 12, fontWeight: "600", color: "#444" },
});

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function InvestmentsScreen() {
  const [selected, setSelected] = useState<Investment | null>(null);
  const investments = investmentsData.investment_options;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Header */}
        <View style={styles.header}>
          <InvestText style={styles.headerTitle}>Investments</InvestText>
          <InvestText style={styles.headerSub}>
            Your guide to growing wealth
          </InvestText>
        </View>

        {/* Calculator */}
        <SIPCalculator />

        {/* Quick legend */}
        <View style={styles.legendRow}>
          {[
            { label: "Low Risk", color: "#00C853" },
            { label: "Moderate", color: "#4DABF7" },
            { label: "High Risk", color: "#FF6B6B" },
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
          ⚠️ Returns shown are historical estimates. Investments are subject to
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
  container: { flex: 1, backgroundColor: "#F8F8F8" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },
  header: { paddingTop: 20, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: "900", color: "#1A1A1A" },
  headerSub: { fontSize: 14, color: "#888", marginTop: 4 },
  legendRow: {
    flexDirection: "row",
    gap: 16,
    marginVertical: 16,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.6)",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, color: "#555", fontWeight: "600" },
  disclaimer: {
    fontSize: 11,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 16,
    marginTop: 8,
    fontStyle: "italic",
  },
});
