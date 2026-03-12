import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import { useUser } from "@/context/user-context";
import questionnaireData from "@/data/questionnaire.json";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
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
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  RadialGradient,
  Stop,
} from "react-native-svg";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// ─── Vortex ring definitions (4 rings, one per icon) ────────────────────────
const RING_CX = SCREEN_W / 2;
const RING_CY = SCREEN_H * 0.44;
// Tighter ellipses so icons stay on-screen
const RINGS = [
  { rx: 100, ry: 40 }, // inner        — piggy-bank
  { rx: 175, ry: 70 }, // middle       — chart-line
  { rx: 248, ry: 99 }, // outer        — bitcoin
];

// ─── Types ────────────────────────────────────────────────────────────────────

type QuestionType =
  | "single_choice"
  | "multiple_choice"
  | "number"
  | "text"
  | "boolean";
type AnswerValue = string | string[] | number | boolean;

interface QuestionWithSection {
  id: string;
  question: string;
  type: QuestionType;
  options?: string[];
  section: string;
}

// ─── Flatten all questions into a single ordered list ─────────────────────────

const ALL_QUESTIONS: QuestionWithSection[] =
  questionnaireData.onboarding_questionnaire.flatMap((section) =>
    section.questions.map((q) => ({
      ...q,
      type: q.type as QuestionType,
      section: section.section,
    })),
  );

const TOTAL = ALL_QUESTIONS.length;

// ─── Root component ───────────────────────────────────────────────────────────

type Step = "landing" | "questionnaire";

export default function Onboarding() {
  const [step, setStep] = useState<Step>("landing");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [inputValue, setInputValue] = useState("");
  const router = useRouter();
  const { setAnswers: saveAnswersToContext, setProfile } = useUser();

  function handleAnswer(id: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleNext() {
    const q = ALL_QUESTIONS[currentIndex];
    let updatedAnswers = { ...answers };

    // Commit text / number inputs into answers map
    if (q.type === "number" || q.type === "text") {
      const value =
        q.type === "number" ? Number(inputValue) : inputValue.trim();
      updatedAnswers[q.id] = value;
      handleAnswer(q.id, value);
    }

    if (currentIndex === TOTAL - 1) {
      // Save answers to context before navigating
      saveAnswersToContext(updatedAnswers);
      // Update profile with the entered name
      setProfile({
        name: (updatedAnswers.user_name as string) || "User",
        persona: (updatedAnswers.occupation as string) || "Student",
        monthlyIncome: (updatedAnswers.monthly_income as number) || 0,
        salaryDay: 1,
        riskLevel: "Moderate",
        baseCurrency: "INR",
      });
      // Onboarding complete — replace so user can't swipe back into it
      router.replace("/(tabs)");
    } else {
      setCurrentIndex((i) => i + 1);
      setInputValue("");
    }
  }

  if (step === "landing") {
    return <LandingScreen onStart={() => setStep("questionnaire")} />;
  }

  return (
    <QuestionnaireScreen
      currentIndex={currentIndex}
      answers={answers}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onAnswer={handleAnswer}
      onNext={handleNext}
      onBack={() => {
        if (currentIndex === 0) {
          setStep("landing");
        } else {
          setCurrentIndex((i) => i - 1);
          setInputValue("");
        }
      }}
    />
  );
}

// ─── Landing Screen ───────────────────────────────────────────────────────────

function LandingScreen({ onStart }: { onStart: () => void }) {
  // Orbit angle (radians) for each icon — staggered so they start spread out
  const orbit1 = useSharedValue(Math.PI * 0.3); // piggy-bank  — inner
  const orbit2 = useSharedValue(Math.PI * 1.2); // chart-line  — middle
  const orbit3 = useSharedValue(Math.PI * 1.8); // bitcoin     — outer

  React.useEffect(() => {
    orbit1.value = withRepeat(
      withTiming(orbit1.value + Math.PI * 2, {
        duration: 18000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    orbit2.value = withRepeat(
      withTiming(orbit2.value + Math.PI * 2, {
        duration: 26000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    orbit3.value = withRepeat(
      withTiming(orbit3.value + Math.PI * 2, {
        duration: 34000,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const CX = SCREEN_W / 2;
  const CY = SCREEN_H * 0.44;
  const H = 27; // half of icon bubble size (54/2)

  const piggyStyle = useAnimatedStyle(() => ({
    left: CX + RINGS[0].rx * Math.cos(orbit1.value) - H,
    top: CY + RINGS[0].ry * Math.sin(orbit1.value) - H,
  }));
  const chartStyle = useAnimatedStyle(() => ({
    left: CX + RINGS[1].rx * Math.cos(orbit2.value) - H,
    top: CY + RINGS[1].ry * Math.sin(orbit2.value) - H,
  }));
  const bitcoinStyle = useAnimatedStyle(() => ({
    left: CX + RINGS[2].rx * Math.cos(orbit3.value) - H,
    top: CY + RINGS[2].ry * Math.sin(orbit3.value) - H,
  }));

  const handlePress = () => setTimeout(() => onStart(), 50);

  return (
    <View style={ls.root}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* ── 4 orbital rings + centre glow (SVG, static) ── */}
      <View style={StyleSheet.absoluteFill}>
        <Svg width={SCREEN_W} height={SCREEN_H}>
          <Defs>
            <RadialGradient id="centreGlow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity={1} />
              <Stop offset="28%" stopColor="#ffffff" stopOpacity={0.85} />
              <Stop offset="60%" stopColor="#aaaaaa" stopOpacity={0.25} />
              <Stop offset="100%" stopColor="#000000" stopOpacity={0} />
            </RadialGradient>
          </Defs>

          {RINGS.map((ring, i) => (
            <Ellipse
              key={i}
              cx={RING_CX}
              cy={RING_CY}
              rx={ring.rx}
              ry={ring.ry}
              fill="none"
              stroke="rgba(255,255,255,0.28)"
              strokeWidth={0.7}
            />
          ))}

          <Circle cx={RING_CX} cy={RING_CY} r={56} fill="url(#centreGlow)" />
          <Circle cx={RING_CX} cy={RING_CY} r={8} fill="white" opacity={0.95} />
        </Svg>
      </View>

      {/* ── Bottom fade ── */}
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)", "#000000"]}
        style={ls.bottomFade}
      />

      {/* ── Icons orbiting their rings ── */}
      <Animated.View style={[ls.iconWrap, piggyStyle]}>
        <View style={[ls.iconBubble, ls.iconPink]}>
          <MaterialCommunityIcons name="piggy-bank" size={26} color="#fb7185" />
        </View>
      </Animated.View>

      <Animated.View style={[ls.iconWrap, chartStyle]}>
        <View style={[ls.iconBubble, ls.iconGreen]}>
          <MaterialCommunityIcons name="chart-line" size={26} color="#4ade80" />
        </View>
      </Animated.View>

      <Animated.View style={[ls.iconWrap, bitcoinStyle]}>
        <View style={[ls.iconBubble, ls.iconGold]}>
          <MaterialCommunityIcons name="bitcoin" size={26} color="#fbbf24" />
        </View>
      </Animated.View>

      {/* ── Bottom text + CTA ── */}
      <View style={ls.bottomContent}>
        <Text style={ls.heading}>Take Control of Your Money</Text>
        <Text style={ls.subText}>
          Track expenses with voice, understand investments, simulate returns,
          and plan financial goals — all in one intelligent finance companion.
        </Text>
        <View style={{ marginTop: 32 }}>
          <PrimaryButton text="Continue" onPress={handlePress} />
        </View>
      </View>
    </View>
  );
}

const ls = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000",
  },
  bottomFade: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
    zIndex: 1,
  },
  iconWrap: {
    position: "absolute",
    zIndex: 5,
  },
  iconBubble: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  iconGreen: {
    backgroundColor: "rgba(74,222,128,0.12)",
    borderColor: "rgba(74,222,128,0.35)",
  },
  iconPink: {
    backgroundColor: "rgba(251,113,133,0.12)",
    borderColor: "rgba(251,113,133,0.35)",
  },
  iconGold: {
    backgroundColor: "rgba(251,191,36,0.12)",
    borderColor: "rgba(251,191,36,0.35)",
  },
  bottomContent: {
    position: "absolute",
    bottom: 100,
    left: 32,
    right: 32,
    zIndex: 10,
  },
  heading: {
    fontSize: 28,
    fontWeight: "600",
    color: "#FFFFFF",
    letterSpacing: -1.5,
    marginBottom: 12,
  },
  subText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
    lineHeight: 24,
  },
  arrowBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  arrowText: {
    fontSize: 22,
    color: "#FFFFFF",
    fontWeight: "400",
  },
});

// ─── Questionnaire Screen ─────────────────────────────────────────────────────

interface QuestionnaireScreenProps {
  currentIndex: number;
  answers: Record<string, AnswerValue>;
  inputValue: string;
  onInputChange: (v: string) => void;
  onAnswer: (id: string, value: AnswerValue) => void;
  onNext: () => void;
  onBack: () => void;
}

function QuestionnaireScreen({
  currentIndex,
  answers,
  inputValue,
  onInputChange,
  onAnswer,
  onNext,
  onBack,
}: QuestionnaireScreenProps) {
  const question = ALL_QUESTIONS[currentIndex];
  const isLast = currentIndex === TOTAL - 1;

  // Progress bar pixel width (avoids TS percentage-string type issues)
  const progressWidth = Math.round(
    ((currentIndex + 1) / TOTAL) * (SCREEN_W - 48),
  );

  function canProceed(): boolean {
    if (question.type === "number" || question.type === "text") {
      return inputValue.trim().length > 0;
    }
    if (question.type === "multiple_choice") {
      const ans = answers[question.id] as string[] | undefined;
      return Array.isArray(ans) && ans.length > 0;
    }
    return answers[question.id] !== undefined;
  }

  function toggleMulti(option: string) {
    const current = (answers[question.id] as string[]) || [];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    onAnswer(question.id, updated);
  }

  // ── Option renderers ──────────────────────────────────────────────────────

  function renderSingleChoice() {
    const opts =
      question.type === "boolean" ? ["Yes", "No"] : (question.options ?? []);
    const selected = answers[question.id] as string | undefined;

    return (
      <View style={qs.optionsList}>
        {opts.map((opt) => {
          const active = selected === opt;
          return (
            <TouchableOpacity
              key={opt}
              style={[qs.optCard, active && qs.optCardActive]}
              onPress={() => onAnswer(question.id, opt)}
              activeOpacity={0.7}
            >
              <Text style={[qs.optText, active && qs.optTextActive]}>
                {opt}
              </Text>
              {/* <View style={[qs.radio, active && qs.radioActive]}>
                {active && <View style={qs.radioDot} />}
              </View> */}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderMultiChoice() {
    const selected = (answers[question.id] as string[]) ?? [];

    return (
      <View style={qs.optionsList}>
        {(question.options ?? []).map((opt) => {
          const active = selected.includes(opt);
          return (
            <TouchableOpacity
              key={opt}
              style={[qs.optCard, active && qs.optCardActive]}
              onPress={() => toggleMulti(opt)}
              activeOpacity={0.7}
            >
              <Text style={[qs.optText, active && qs.optTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderTextInput() {
    const isNumber = question.type === "number";
    return (
      <View style={qs.inputWrap}>
        {isNumber && <Text style={qs.currencyPrefix}>₹</Text>}
        <TextInput
          style={[qs.input, isNumber && qs.inputWithPrefix]}
          value={inputValue}
          onChangeText={onInputChange}
          placeholder={isNumber ? "0" : "Type your answer here…"}
          placeholderTextColor="#999999"
          keyboardType={isNumber ? "numeric" : "default"}
          multiline={question.type === "text"}
          numberOfLines={question.type === "text" ? 4 : 1}
          textAlignVertical={question.type === "text" ? "top" : "center"}
        />
      </View>
    );
  }

  function renderInput() {
    switch (question.type) {
      case "single_choice":
      case "boolean":
        return renderSingleChoice();
      case "multiple_choice":
        return renderMultiChoice();
      case "number":
      case "text":
        return renderTextInput();
      default:
        return null;
    }
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={qs.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />

      {/* ── Header ── */}
      <View style={qs.header}>
        <TouchableOpacity
          onPress={onBack}
          style={qs.backBtn}
          activeOpacity={0.7}
        >
          <Text style={qs.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={qs.headerLeft}>
          <Text style={qs.sectionName}>{question.section}</Text>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <View style={qs.progressTrack}>
        <View style={[qs.progressFill, { width: progressWidth }]} />
      </View>

      {/* ── Scrollable question + options ── */}
      <KeyboardAvoidingView
        style={qs.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={20}
      >
        <ScrollView
          style={qs.scroll}
          contentContainerStyle={qs.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Multiple-choice hint badge */}
          {question.type === "multiple_choice" && (
            <View style={qs.hintBadge}>
              <Text style={qs.hintBadgeText}>Select all that apply</Text>
            </View>
          )}

          <Text style={qs.questionText}>{question.question}</Text>

          {renderInput()}

          {/* Spacer so content clears the sticky footer */}
          <View style={{ height: 24 }} />
        </ScrollView>

        {/* ── Sticky footer button ── */}
        <View style={qs.footer}>
          <SecondaryButton
            text={isLast ? "Save & Continue" : "Next"}
            onPress={onNext}
            disabled={!canProceed()}
            style={qs.footerBtn}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const qs = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F5F3F0",
  },
  flex: {
    flex: 1,
  },

  // ── Header ──────────────────────────────────────────────────────────────────
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.07)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    flexShrink: 0,
  },
  backArrow: {
    fontSize: 18,
    color: "#1A1A1A",
    lineHeight: 22,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: 1.8,
    marginBottom: 3,
  },
  sectionName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#1A1A1A",
    letterSpacing: -0.3,
  },
  progressCounter: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  progressCurrent: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1A1A1A",
  },
  progressSep: {
    fontSize: 14,
    color: "#5A5A6E",
  },
  progressTotal: {
    fontSize: 14,
    color: "#5A5A6E",
    fontWeight: "500",
  },

  // ── Progress bar ─────────────────────────────────────────────────────────────
  progressTrack: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginHorizontal: 24,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#000000",
    borderRadius: 4,
  },

  // ── Scroll area ───────────────────────────────────────────────────────────────
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
  },

  // ── Hint badge ────────────────────────────────────────────────────────────────
  hintBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: "rgba(0,0,0,0.07)",
    marginBottom: 12,
  },
  hintBadgeText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#1A1A1A",
    letterSpacing: 0.2,
  },

  // ── Question text ─────────────────────────────────────────────────────────────
  questionText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1A1A1A",
    lineHeight: 31,
    marginBottom: 24,
    letterSpacing: -0.3,
  },

  // ── Option cards ──────────────────────────────────────────────────────────────
  optionsList: {
    gap: 10,
  },
  optCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.1)",
  },
  optCardActive: {
    backgroundColor: "#FFFFFF",
    borderColor: "#000000",
    borderWidth: 1.5,
  },
  optText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#666666",
    marginRight: 12,
  },
  optTextActive: {
    color: "#1A1A1A",
    fontWeight: "600",
  },

  // ── Radio indicator ───────────────────────────────────────────────────────────
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioActive: {
    borderColor: "#000000",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#000000",
  },

  // ── Checkbox indicator ────────────────────────────────────────────────────────
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#1A1A1A",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: "#000000",
    borderColor: "#000000",
  },
  checkmark: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 15,
  },

  // ── Text / Number input ───────────────────────────────────────────────────────
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 56,
  },
  currencyPrefix: {
    paddingLeft: 18,
    fontSize: 18,
    fontWeight: "600",
    color: "#1A1A1A",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#1A1A1A",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  inputWithPrefix: {
    paddingLeft: 8,
  },

  // ── Footer ────────────────────────────────────────────────────────────────────
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 12 : 20,
    backgroundColor: "#F5F3F0",
  },
  footerBtn: {
    width: "100%",
  },
});
