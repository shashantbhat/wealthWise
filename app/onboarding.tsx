import { Button } from "@/components/ui/button";
import { useUser } from "@/context/user-context";
import questionnaireData from "@/data/questionnaire.json";
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
import Svg, { Rect } from "react-native-svg";

const { width: SW } = Dimensions.get("window");

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
    />
  );
}

// ─── Landing Screen ───────────────────────────────────────────────────────────

function LandingScreen({ onStart }: { onStart: () => void }) {
  const buttonScale = useSharedValue(1);

  // Blob animations
  const blob1Y = useSharedValue(-80);
  const blob2Y = useSharedValue(-120);

  React.useEffect(() => {
    // Animate blob 1
    blob1Y.value = withRepeat(
      withTiming(-60, {
        duration: 8000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );

    // Animate blob 2
    blob2Y.value = withRepeat(
      withTiming(-100, {
        duration: 9000,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const blob1Style = useAnimatedStyle(() => ({
    top: blob1Y.value,
  }));

  const blob2Style = useAnimatedStyle(() => ({
    bottom: blob2Y.value,
  }));

  const handlePress = () => {
    buttonScale.value = withTiming(0.98, { duration: 100 }, () => {
      buttonScale.value = withTiming(1, { duration: 100 });
    });
    setTimeout(() => onStart(), 50);
  };

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  return (
    <SafeAreaView style={ls.root}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />

      {/* Animated Gradient Background */}
      <LinearGradient
        colors={["#F5F3F0", "#FAFAF8", "#F0EAEA"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={ls.gradientBg}
      />

  

      {/* Logo with Glassmorphic Background */}
      <View style={ls.logoWrap}>
        <View style={ls.logoGlassBg}>
          <Svg width={90} height={90} viewBox="0 0 90 90">
            {/* Bar 1 - Small */}
            <Rect x={15} y={50} width={12} height={25} fill="#FF8C00" rx={3} />
            {/* Bar 2 - Medium */}
            <Rect x={40} y={35} width={12} height={40} fill="#FFB347" rx={3} />
            {/* Bar 3 - Large */}
            <Rect x={65} y={15} width={12} height={60} fill="#FFAA1D" rx={3} />
          </Svg>
        </View>
      </View>

      {/* App name & tagline */}
      <View style={ls.textBlock}>
        <Text style={ls.appName}>WealthWise</Text>
        <Text style={ls.tagline}>Your wealth, simplified</Text>
        <Text style={ls.description}>
          Clear answers, conscious decisions, confident results.
        </Text>
      </View>

      {/* Feature pills - Glassmorphic */}
      <View style={ls.pills}>
        {["Track", "Plan", "Grow"].map((label) => (
          <View key={label} style={ls.pill}>
            <Text style={ls.pillText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* CTA - Animated with Gradient */}
      <View style={ls.ctaBlock}>
        <Animated.View style={[buttonAnimatedStyle, { width: SW - 56 }]}>
          <LinearGradient
            colors={["#FF8C00", "#FFB84D"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={ls.ctaGradient}
          >
            <TouchableOpacity
              style={ls.ctaButton}
              onPress={handlePress}
              activeOpacity={1}
            >
              <Text style={ls.ctaText}>Get Started</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const ls = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    overflow: "hidden",
    backgroundColor: "#F5F3F0",
  },
  gradientBg: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  blob1: {
    position: "absolute",
    width: 350,
    height: 350,
    borderRadius: 175,
    backgroundColor: "#1B2B5F",
    top: -80,
    left: -100,
    zIndex: 1,
  },
  blob2: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "#D4A574",
    bottom: -120,
    right: -80,
    zIndex: 1,
  },
  logoWrap: {
    marginBottom: 32,
    zIndex: 10,
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 4,
  },
  logoGlassBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
    backdropFilter: "blur(30px)",
  },
  textBlock: {
    alignItems: "center",
    marginBottom: 28,
    zIndex: 10,
  },
  appName: {
    fontSize: 42,
    fontWeight: "800",
    color: "#1A1A1A",
    letterSpacing: -0.8,
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    fontWeight: "700",
    color: "#FF8C00",
    marginBottom: 12,
    letterSpacing: 0.2,
  },
  description: {
    fontSize: 15,
    lineHeight: 24,
    color: "#666666",
    textAlign: "center",
    maxWidth: 320,
    fontWeight: "500",
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
    marginBottom: 48,
    zIndex: 10,
  },
  pill: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.6)",
  },
  pillText: {
    fontSize: 13,
    color: "#1A1A1A",
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  ctaBlock: {
    alignItems: "center",
    gap: 12,
    zIndex: 10,
  },
  ctaGradient: {
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#FF8C00",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  ctaButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  ctaHint: {
    fontSize: 12.5,
    color: "#999999",
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
}

function QuestionnaireScreen({
  currentIndex,
  answers,
  inputValue,
  onInputChange,
  onAnswer,
  onNext,
}: QuestionnaireScreenProps) {
  const question = ALL_QUESTIONS[currentIndex];
  const isLast = currentIndex === TOTAL - 1;

  // Progress bar pixel width (avoids TS percentage-string type issues)
  const progressWidth = Math.round(((currentIndex + 1) / TOTAL) * (SW - 48));

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
              <View style={[qs.checkbox, active && qs.checkboxActive]}>
                {active && <Text style={qs.checkmark}>✓</Text>}
              </View>
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
        <View style={qs.headerLeft}>
          <Text style={qs.sectionName}>{question.section}</Text>
        </View>
        <View style={qs.progressCounter}>
          <Text style={qs.progressCurrent}>{currentIndex + 1}</Text>
          <Text style={qs.progressSep}> / </Text>
          <Text style={qs.progressTotal}>{TOTAL}</Text>
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
          <Button
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
    alignItems: "flex-end",
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 14,
  },
  headerLeft: {
    flex: 1,
    marginRight: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FF8C00",
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
    color: "#FF8C00",
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
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 24,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#FF8C00",
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
    backgroundColor: "rgba(255, 140, 0, 0.1)",
    marginBottom: 12,
  },
  hintBadgeText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#FF8C00",
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
    backgroundColor: "rgba(255, 255, 255, 0.35)",
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  optCardActive: {
    backgroundColor: "rgba(255, 140, 0, 0.1)",
    borderColor: "#FF8C00",
  },
  optText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#666666",
    marginRight: 12,
  },
  optTextActive: {
    color: "#FF8C00",
    fontWeight: "600",
  },

  // ── Radio indicator ───────────────────────────────────────────────────────────
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#FF8C00",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioActive: {
    borderColor: "#FF8C00",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF8C00",
  },

  // ── Checkbox indicator ────────────────────────────────────────────────────────
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FF8C00",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: "#FF8C00",
    borderColor: "#FF8C00",
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
    color: "#FF8C00",
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
