import {
  ArchivedMonth,
  getAllArchivedMonths,
  MonthlyData,
} from "@/app/utils/expenseStorageOptimized";
import { useExpenses } from "@/context/expenseContextOptimized";
import { useUser } from "@/context/user-context";
import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#FF6B6B",
  Travel: "#4ECDC4",
  Shopping: "#FFE66D",
  Health: "#95E1D3",
  Entertainment: "#C7CEEA",
  Accommodation: "#FF9F43",
  Wellness: "#A8E6CF",
};

interface ChatMessage {
  role: "user" | "ai";
  text: string;
  loading?: boolean;
}

interface InsightCard {
  title: string;
  value: string;
  subtitle: string;
  color: string;
  icon: string;
}

function buildFinancialContext(
  currentMonth: MonthlyData | null,
  archivedMonths: ArchivedMonth[],
  monthlyIncome: number,
): string {
  if (!currentMonth) return "No expense data available yet.";

  const totalSpent = currentMonth.monthlyTotal;
  const savings = monthlyIncome - totalSpent;
  const savingsRate = monthlyIncome > 0 ? (savings / monthlyIncome) * 100 : 0;
  const today = new Date();
  const daysElapsed = today.getDate();
  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0,
  ).getDate();
  const dailyBurn = daysElapsed > 0 ? totalSpent / daysElapsed : 0;
  const projectedTotal = dailyBurn * daysInMonth;

  const categoryLines = Object.entries(currentMonth.categoryBreakdown)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .map(
      ([cat, amt]) =>
        `  - ${cat}: ₹${amt.toFixed(0)} (${monthlyIncome > 0 ? ((amt / monthlyIncome) * 100).toFixed(1) : 0}% of income)`,
    )
    .join("\n");

  const archiveSummary =
    archivedMonths.length > 0
      ? archivedMonths
          .slice(0, 3)
          .map((m) => `  - ${m.year}/${m.month}: ₹${m.monthlyTotal.toFixed(0)}`)
          .join("\n")
      : "  No previous months available.";

  return `
USER FINANCIAL SNAPSHOT:
Monthly Income: ₹${monthlyIncome.toFixed(0)}
Total Spent This Month: ₹${totalSpent.toFixed(0)}
Remaining Budget: ₹${Math.max(0, savings).toFixed(0)}
Savings Rate: ${savingsRate.toFixed(1)}%
Days Elapsed: ${daysElapsed}/${daysInMonth}
Daily Burn Rate: ₹${dailyBurn.toFixed(0)}/day
Projected Month-End Total: ₹${projectedTotal.toFixed(0)}

SPENDING BY CATEGORY THIS MONTH:
${categoryLines || "  No spending recorded."}

PREVIOUS MONTHS:
${archiveSummary}
`.trim();
}

async function askGemini(
  financialContext: string,
  messages: ChatMessage[],
  userQuestion: string,
): Promise<string> {
  const systemPrompt = `You are a friendly, knowledgeable personal finance advisor integrated into a budgeting app. 
Your goal is to make users financially literate and aware of their spending habits.
Be concise, warm, and actionable. Use simple language. Avoid jargon.
When highlighting problems, always suggest a specific, practical fix.
Format responses clearly — use short paragraphs or bullet points where helpful.
Never exceed 250 words in a response.

${financialContext}`;

  const history = messages
    .filter((m) => !m.loading)
    .slice(-6)
    .map((m) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.text }],
    }));

  const body = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [
      ...history,
      { role: "user", parts: [{ text: userQuestion }] },
    ],
    generationConfig: { maxOutputTokens: 350, temperature: 0.7 },
  };

  const res = await fetch(GEMINI_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text ||
    "Sorry, I couldn't generate a response. Please try again."
  );
}

const QUICK_QUESTIONS = [
  "How am I doing this month?",
  "Where am I overspending?",
  "How can I save more?",
  "Will I go over budget?",
];

export default function AnalyticsScreen() {
  const { currentMonth, loading: contextLoading } = useExpenses();
  const { monthlyIncome = 0, salaryDay = 1 } = useUser();
  const [archivedMonths, setArchivedMonths] = useState<ArchivedMonth[]>([]);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [initialInsightLoaded, setInitialInsightLoaded] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    getAllArchivedMonths()
      .then(setArchivedMonths)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [currentMonth]);

  // Auto-load initial AI insight once data is ready
  useEffect(() => {
    if (
      !loading &&
      !contextLoading &&
      !initialInsightLoaded &&
      monthlyIncome > 0
    ) {
      setInitialInsightLoaded(true);
      loadInitialInsight();
    }
  }, [loading, contextLoading, monthlyIncome, initialInsightLoaded]);

  const loadInitialInsight = async () => {
    const context = buildFinancialContext(
      currentMonth,
      archivedMonths,
      monthlyIncome,
    );
    setIsThinking(true);
    setMessages([{ role: "ai", text: "", loading: true }]);
    try {
      const reply = await askGemini(
        context,
        [],
        "Give me a brief overview of my financial health this month. Highlight my biggest spending area and one thing I should watch out for.",
      );
      setMessages([{ role: "ai", text: reply }]);
    } catch {
      setMessages([
        {
          role: "ai",
          text: "Hi! I'm your financial advisor. Ask me anything about your spending.",
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const sendMessage = async (text?: string) => {
    const question = (text || inputText).trim();
    if (!question || isThinking) return;

    setInputText("");
    const userMsg: ChatMessage = { role: "user", text: question };
    const loadingMsg: ChatMessage = { role: "ai", text: "", loading: true };
    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsThinking(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    const context = buildFinancialContext(
      currentMonth,
      archivedMonths,
      monthlyIncome,
    );

    try {
      const reply = await askGemini(context, [...messages, userMsg], question);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "ai", text: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        {
          role: "ai",
          text: "Something went wrong. Please check your connection and try again.",
        },
      ]);
    } finally {
      setIsThinking(false);
      setTimeout(
        () => scrollRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  };

  // Compute insight cards from live data
  const insightCards: InsightCard[] = (() => {
    if (!currentMonth || monthlyIncome <= 0) return [];
    const spent = currentMonth.monthlyTotal;
    const savings = monthlyIncome - spent;
    const savingsRate = (savings / monthlyIncome) * 100;
    const today = new Date();
    const daysElapsed = today.getDate();
    const daysInMonth = new Date(
      today.getFullYear(),
      today.getMonth() + 1,
      0,
    ).getDate();
    const dailyBurn = daysElapsed > 0 ? spent / daysElapsed : 0;
    const projected = dailyBurn * daysInMonth;
    const topCategory = Object.entries(currentMonth.categoryBreakdown)
      .filter(([, v]) => v > 0)
      .sort(([, a], [, b]) => b - a)[0];

    return [
      {
        title: "Savings Rate",
        value: `${Math.max(0, savingsRate).toFixed(1)}%`,
        subtitle: savingsRate >= 20 ? "Healthy ✓" : "Below 20% target",
        color: savingsRate >= 20 ? "#29C983" : "#FF6B6B",
        icon: "trending-up-outline",
      },
      {
        title: "Daily Burn",
        value: `₹${dailyBurn.toFixed(0)}`,
        subtitle: `${daysElapsed}/${daysInMonth} days elapsed`,
        color: "#4ECDC4",
        icon: "flame-outline",
      },
      {
        title: "Projected Total",
        value: `₹${projected.toFixed(0)}`,
        subtitle:
          projected > monthlyIncome ? "Over budget!" : "Within budget",
        color: projected > monthlyIncome ? "#FF6B6B" : "#29C983",
        icon: "analytics-outline",
      },
      {
        title: "Top Spend",
        value: topCategory ? topCategory[0] : "—",
        subtitle: topCategory ? `₹${topCategory[1].toFixed(0)}` : "No data",
        color: topCategory
          ? (CATEGORY_COLORS[topCategory[0]] ?? "#888")
          : "#888",
        icon: "podium-outline",
      },
    ];
  })();

  // Category bar data
  const categoryBars = currentMonth
    ? Object.entries(currentMonth.categoryBreakdown)
        .filter(([, v]) => v > 0)
        .sort(([, a], [, b]) => b - a)
    : [];

  const maxCategoryAmount = categoryBars.length > 0 ? categoryBars[0][1] : 1;

  if (loading || contextLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#1A1A1A" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSubtitle}>
            AI-powered financial insights
          </Text>
        </View>

        {/* Insight Cards */}
        {insightCards.length > 0 && (
          <View style={styles.cardsGrid}>
            {insightCards.map((card, i) => (
              <View key={i} style={styles.insightCard}>
                <View
                  style={[
                    styles.insightIconBox,
                    { backgroundColor: card.color + "18" },
                  ]}
                >
                  <Ionicons
                    name={card.icon as any}
                    size={18}
                    color={card.color}
                  />
                </View>
                <Text style={styles.insightCardTitle}>{card.title}</Text>
                <Text style={[styles.insightCardValue, { color: card.color }]}>
                  {card.value}
                </Text>
                <Text style={styles.insightCardSub}>{card.subtitle}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Category Breakdown */}
        {categoryBars.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Spending Breakdown</Text>
            <View style={styles.categoryList}>
              {categoryBars.map(([cat, amt]) => {
                const pct = (amt / (currentMonth?.monthlyTotal || 1)) * 100;
                const barWidth = (amt / maxCategoryAmount) * 100;
                const color = CATEGORY_COLORS[cat] ?? "#CCCCCC";
                return (
                  <View key={cat} style={styles.categoryRow}>
                    <View style={styles.categoryLabelRow}>
                      <View
                        style={[styles.categoryDot, { backgroundColor: color }]}
                      />
                      <Text style={styles.categoryName}>{cat}</Text>
                      <Text style={styles.categoryPct}>
                        {pct.toFixed(1)}%
                      </Text>
                      <Text style={styles.categoryAmt}>
                        ₹{amt.toFixed(0)}
                      </Text>
                    </View>
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            width: `${barWidth}%` as any,
                            backgroundColor: color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* AI Chat Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ask Your Finance Advisor</Text>

          {/* Messages */}
          <View style={styles.chatContainer}>
            {messages.length === 0 && !isThinking && (
              <View style={styles.emptyChat}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={32}
                  color="#CCCCCC"
                />
                <Text style={styles.emptyChatText}>
                  Ask me anything about your finances
                </Text>
              </View>
            )}
            {messages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.messageBubble,
                  msg.role === "user"
                    ? styles.userBubble
                    : styles.aiBubble,
                ]}
              >
                {msg.loading ? (
                  <View style={styles.thinkingRow}>
                    <ActivityIndicator size="small" color="#888" />
                    <Text style={styles.thinkingText}>Thinking...</Text>
                  </View>
                ) : (
                  <Text
                    style={
                      msg.role === "user"
                        ? styles.userText
                        : styles.aiText
                    }
                  >
                    {msg.text}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Quick Questions */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickScroll}
            contentContainerStyle={styles.quickContent}
          >
            {QUICK_QUESTIONS.map((q, i) => (
              <TouchableOpacity
                key={i}
                style={styles.quickChip}
                onPress={() => sendMessage(q)}
                disabled={isThinking}
              >
                <Text style={styles.quickChipText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Input Row */}
          <View style={styles.inputRow}>
            <TextInput
              style={styles.chatInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask about your spending..."
              placeholderTextColor="#BBBBBB"
              multiline
              returnKeyType="send"
              onSubmitEditing={() => sendMessage()}
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!inputText.trim() || isThinking) && styles.sendBtnDisabled,
              ]}
              onPress={() => sendMessage()}
              disabled={!inputText.trim() || isThinking}
            >
              <Ionicons name="send" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1A1A1A",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#999999",
    marginTop: 2,
  },
  cardsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 8,
  },
  insightCard: {
    width: "47%",
    backgroundColor: "#F9F9F9",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  insightIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  insightCardTitle: {
    fontSize: 11,
    color: "#999999",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  insightCardValue: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  insightCardSub: {
    fontSize: 11,
    color: "#AAAAAA",
  },
  section: {
    marginHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 14,
  },
  categoryList: {
    backgroundColor: "#F9F9F9",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    gap: 12,
  },
  categoryRow: {
    gap: 6,
  },
  categoryLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryName: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  categoryPct: {
    fontSize: 12,
    color: "#999999",
    marginRight: 4,
  },
  categoryAmt: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A1A1A",
    minWidth: 60,
    textAlign: "right",
  },
  barTrack: {
    height: 5,
    backgroundColor: "#EFEFEF",
    borderRadius: 3,
    overflow: "hidden",
  },
  barFill: {
    height: "100%",
    borderRadius: 3,
  },
  chatContainer: {
    backgroundColor: "#F9F9F9",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EFEFEF",
    minHeight: 100,
    marginBottom: 10,
    gap: 10,
  },
  emptyChat: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 8,
  },
  emptyChatText: {
    fontSize: 13,
    color: "#CCCCCC",
    textAlign: "center",
  },
  messageBubble: {
    maxWidth: "90%",
    borderRadius: 14,
    padding: 12,
  },
  userBubble: {
    backgroundColor: "#1A1A1A",
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    backgroundColor: "#FFFFFF",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#EFEFEF",
  },
  userText: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
  },
  aiText: {
    color: "#1A1A1A",
    fontSize: 14,
    lineHeight: 20,
  },
  thinkingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  thinkingText: {
    fontSize: 13,
    color: "#999999",
  },
  quickScroll: {
    marginBottom: 10,
  },
  quickContent: {
    gap: 8,
    paddingRight: 4,
  },
  quickChip: {
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  quickChipText: {
    fontSize: 12,
    color: "#444444",
    fontWeight: "500",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: "#1A1A1A",
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: "#1A1A1A",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: "#CCCCCC",
  },
});