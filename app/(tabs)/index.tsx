import React from "react";
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Circle } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Mock data (replace with real state/context later) ───────────────────────
const MONTHLY_INCOME = 75000;
const MONTHLY_SPENT = 42500;

const RECENT_EXPENSES = [
  {
    id: 1,
    category: "Food",
    description: "Swiggy Order",
    amount: 450,
    date: "Today",
  },
  {
    id: 2,
    category: "Travel",
    description: "Uber Ride",
    amount: 180,
    date: "Today",
  },
  {
    id: 3,
    category: "Shopping",
    description: "Amazon",
    amount: 2300,
    date: "Yesterday",
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  Food: "🍕",
  Travel: "🚗",
  Shopping: "🛍️",
  Health: "💊",
  Entertainment: "🎬",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatINR(amount: number) {
  return "₹" + amount.toLocaleString("en-IN");
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

// ─── Ring Chart (SVG donut) ───────────────────────────────────────────────────
const RING_SIZE = Math.min(SCREEN_WIDTH * 0.62, 240);
const STROKE = 20;
const RING_RADIUS = (RING_SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function RingChart({ progress }: { progress: number }) {
  const clamped = Math.min(1, Math.max(0, progress));
  const offset = CIRCUMFERENCE * (1 - clamped);
  const center = RING_SIZE / 2;
  // Color shifts red when over budget
  const progressColor =
    clamped >= 1 ? "#FF6B6B" : clamped > 0.75 ? "#FFB347" : "#00D09C";

  return (
    <Svg
      width={RING_SIZE}
      height={RING_SIZE}
      style={{ transform: [{ rotate: "-90deg" }] }}
    >
      {/* Track */}
      <Circle
        cx={center}
        cy={center}
        r={RING_RADIUS}
        stroke="#2A2A38"
        strokeWidth={STROKE}
        fill="none"
      />
      {/* Progress arc */}
      <Circle
        cx={center}
        cy={center}
        r={RING_RADIUS}
        stroke={progressColor}
        strokeWidth={STROKE}
        fill="none"
        strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Home Screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const remaining = MONTHLY_INCOME - MONTHLY_SPENT;
  const progress = MONTHLY_SPENT / MONTHLY_INCOME;
  const percentage = Math.round(progress * 100);
  const isOverBudget = MONTHLY_SPENT > MONTHLY_INCOME;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0F0F16" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* ── Header ─────────────────────────────────────────────────── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarLetter}>S</Text>
            </View>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>Shashant 👋</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notifBtn} activeOpacity={0.7}>
            <Text style={styles.notifIcon}>🔔</Text>
          </TouchableOpacity>
        </View>

        {/* ── Ring Chart ─────────────────────────────────────────────── */}
        <View style={styles.ringSection}>
          <Text style={styles.ringTitle}>March Spending</Text>

          <View style={styles.ringWrapper}>
            <RingChart progress={progress} />

            {/* Centre label (sits inside the ring hole) */}
            <View style={styles.ringCenter}>
              <Text
                style={[
                  styles.ringPct,
                  {
                    color: isOverBudget
                      ? "#FF6B6B"
                      : progress > 0.75
                        ? "#FFB347"
                        : "#FFFFFF",
                  },
                ]}
              >
                {percentage}%
              </Text>
              <Text style={styles.ringSpentAmt}>
                {formatINR(MONTHLY_SPENT)}
              </Text>
              <Text style={styles.ringSubText}>
                of {formatINR(MONTHLY_INCOME)}
              </Text>
            </View>
          </View>

          {isOverBudget && (
            <View style={styles.overBudgetBadge}>
              <Text style={styles.overBudgetText}>
                ⚠️ Over budget this month
              </Text>
            </View>
          )}
        </View>

        {/* ── Stats Row ──────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
          <StatCard
            icon="💰"
            label="Income"
            value={formatINR(MONTHLY_INCOME)}
            accent="#00D09C"
          />
          <StatCard
            icon="💸"
            label="Spent"
            value={formatINR(MONTHLY_SPENT)}
            accent="#FF6B6B"
          />
          <StatCard
            icon="🏦"
            label="Remaining"
            value={formatINR(remaining)}
            accent="#4DABF7"
          />
        </View>

        {/* ── Voice Log Button ───────────────────────────────────────── */}
        <TouchableOpacity style={styles.voiceBtn} activeOpacity={0.82}>
          <View style={styles.voiceMic}>
            <Text style={{ fontSize: 26 }}>🎙️</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.voiceTitle}>Log Expense</Text>
            <Text style={styles.voiceSub}>Tap and speak your expense</Text>
          </View>
          <Text style={styles.voiceArrow}>›</Text>
        </TouchableOpacity>

        {/* ── Reports ────────────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Reports</Text>
        <View style={styles.reportsRow}>
          {[
            { label: "Weekly", icon: "📅" },
            { label: "Monthly", icon: "📊" },
            { label: "Yearly", icon: "📈" },
          ].map(({ label, icon }) => (
            <TouchableOpacity
              key={label}
              style={styles.reportCard}
              activeOpacity={0.8}
            >
              <Text style={{ fontSize: 26 }}>{icon}</Text>
              <Text style={styles.reportLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ── Recent Expenses ────────────────────────────────────────── */}
        <Text style={styles.sectionTitle}>Recent Expenses</Text>
        {RECENT_EXPENSES.map((exp) => (
          <View key={exp.id} style={styles.expenseRow}>
            <View style={styles.expenseCategoryIcon}>
              <Text style={{ fontSize: 20 }}>
                {CATEGORY_ICONS[exp.category] ?? "💳"}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.expenseDesc}>{exp.description}</Text>
              <Text style={styles.expenseMeta}>
                {exp.category} · {exp.date}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>− {formatINR(exp.amount)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Small stat card ─────────────────────────────────────────────────────────
function StatCard({
  icon,
  label,
  value,
  accent,
}: {
  icon: string;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <View style={[styles.statCard, { borderColor: accent + "55" }]}>
      <Text style={{ fontSize: 20, marginBottom: 6 }}>{icon}</Text>
      <Text style={[styles.statValue, { color: accent }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const CARD_BG = "#1A1A26";

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F0F16" },
  scroll: { paddingHorizontal: 20, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 18,
    paddingBottom: 6,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00D09C",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarLetter: { color: "#0F0F16", fontSize: 22, fontWeight: "800" },
  greeting: { color: "#8E8E9E", fontSize: 13 },
  userName: { color: "#FFFFFF", fontSize: 17, fontWeight: "700" },
  notifBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD_BG,
    justifyContent: "center",
    alignItems: "center",
  },
  notifIcon: { fontSize: 18 },

  // Ring section
  ringSection: { alignItems: "center", marginTop: 28, marginBottom: 4 },
  ringTitle: {
    color: "#8E8E9E",
    fontSize: 14,
    letterSpacing: 0.6,
    marginBottom: 18,
  },
  ringWrapper: {
    width: RING_SIZE,
    height: RING_SIZE,
    justifyContent: "center",
    alignItems: "center",
  },
  ringCenter: { position: "absolute", alignItems: "center" },
  ringPct: { fontSize: 38, fontWeight: "800", lineHeight: 44 },
  ringSpentAmt: {
    color: "#00D09C",
    fontSize: 17,
    fontWeight: "600",
    marginTop: 2,
  },
  ringSubText: { color: "#8E8E9E", fontSize: 12, marginTop: 2 },
  overBudgetBadge: {
    marginTop: 14,
    backgroundColor: "#FF6B6B22",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  overBudgetText: { color: "#FF6B6B", fontSize: 13, fontWeight: "600" },

  // Stats
  statsRow: { flexDirection: "row", gap: 10, marginTop: 28 },
  statCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
    borderWidth: 1,
  },
  statValue: { fontSize: 13, fontWeight: "700" },
  statLabel: { color: "#8E8E9E", fontSize: 11, marginTop: 3 },

  // Voice button
  voiceBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#00D09C",
    borderRadius: 18,
    padding: 18,
    marginTop: 22,
  },
  voiceMic: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#00A882",
    justifyContent: "center",
    alignItems: "center",
  },
  voiceTitle: { color: "#0A2E24", fontSize: 17, fontWeight: "800" },
  voiceSub: { color: "#0D4434", fontSize: 12, marginTop: 2 },
  voiceArrow: { color: "#0A2E24", fontSize: 28, fontWeight: "300" },

  // Reports
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    marginTop: 30,
    marginBottom: 12,
  },
  reportsRow: { flexDirection: "row", gap: 10 },
  reportCard: {
    flex: 1,
    backgroundColor: CARD_BG,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
  },
  reportLabel: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },

  // Recent expenses
  expenseRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD_BG,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    gap: 12,
  },
  expenseCategoryIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#252534",
    justifyContent: "center",
    alignItems: "center",
  },
  expenseDesc: { color: "#FFFFFF", fontSize: 15, fontWeight: "500" },
  expenseMeta: { color: "#8E8E9E", fontSize: 12, marginTop: 2 },
  expenseAmount: { color: "#FF6B6B", fontSize: 15, fontWeight: "600" },
});
