import { Button } from "@/components/ui/button";
import questionnaireData from "@/data/questionnaire.json";
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
import Svg, { Circle, Path } from "react-native-svg";

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

  function handleAnswer(id: string, value: AnswerValue) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  }

  function handleNext() {
    const q = ALL_QUESTIONS[currentIndex];

    // Commit text / number inputs into answers map
    if (q.type === "number" || q.type === "text") {
      const value =
        q.type === "number" ? Number(inputValue) : inputValue.trim();
      handleAnswer(q.id, value);
    }

    if (currentIndex === TOTAL - 1) {
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
  return (
    <SafeAreaView style={ls.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

      {/* Logo */}
      <View style={ls.logoWrap}>
        <Svg width={80} height={80} viewBox="0 0 80 80">
          <Circle cx={40} cy={40} r={40} fill="#FFFFFF" opacity={0.05} />
          {/* Minimal line chart uptrend */}
          <Path
            d="M20 50 L35 35 L50 42 L65 20"
            stroke="#FFFFFF"
            strokeWidth={3}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </View>

      {/* App name & tagline */}
      <View style={ls.textBlock}>
        <Text style={ls.appName}>WealthWise</Text>
        <Text style={ls.tagline}>Smart financial wellness</Text>
        <Text style={ls.description}>
          Track expenses, plan goals, grow wealth.
        </Text>
      </View>

      {/* Feature pills */}
      <View style={ls.pills}>
        {["Track", "Plan", "Grow"].map((label) => (
          <View key={label} style={ls.pill}>
            <Text style={ls.pillText}>{label}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={ls.ctaBlock}>
        <Button
          text="Get Started"
          onPress={onStart}
          style={{ width: SW - 56 }}
        />

      </View>
    </SafeAreaView>
  );
}

const ls = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0D0D1A",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    overflow: "hidden",
  },
  blob: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.07,
    backgroundColor: "#00D09C",
  },
  blobTL: { top: -100, left: -80 },
  blobBR: { bottom: -100, right: -80 },
  logoWrap: {
    marginBottom: 32,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  textBlock: {
    alignItems: "center",
    marginBottom: 28,
  },
  appName: {
    fontSize: 38,
    fontWeight: "800",
    color: "#EDEDED",
    letterSpacing: -0.8,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 16,
    fontWeight: "600",
    color: "#CCCCCC",
    marginBottom: 14,
    letterSpacing: 0.1,
  },
  description: {
    fontSize: 14.5,
    lineHeight: 22,
    color: "#9BA1A6",
    textAlign: "center",
    maxWidth: 310,
  },
  pills: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 44,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#444444",
  },
  pillText: {
    fontSize: 12.5,
    color: "#AAAAAA",
    fontWeight: "500",
  },
  ctaBlock: {
    alignItems: "center",
    gap: 12,
  },
  ctaHint: {
    fontSize: 12.5,
    color: "#5A5A6E",
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
          placeholderTextColor="#4A4A5E"
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
      <StatusBar barStyle="light-content" backgroundColor="#0D0D1A" />

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
    backgroundColor: "#0D0D1A",
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
    color: "#00D09C",
    letterSpacing: 1.8,
    marginBottom: 3,
  },
  sectionName: {
    fontSize: 19,
    fontWeight: "700",
    color: "#EDEDED",
    letterSpacing: -0.3,
  },
  progressCounter: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  progressCurrent: {
    fontSize: 24,
    fontWeight: "800",
    color: "#00D09C",
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
    backgroundColor: "#1F1F2E",
    marginHorizontal: 24,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00D09C",
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
    backgroundColor: "#00D09C18",
    marginBottom: 12,
  },
  hintBadgeText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: "#00D09C",
    letterSpacing: 0.2,
  },

  // ── Question text ─────────────────────────────────────────────────────────────
  questionText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#EDEDED",
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
    backgroundColor: "#1A1A2E",
    borderWidth: 1.5,
    borderColor: "#2A2A3E",
  },
  optCardActive: {
    backgroundColor: "#00D09C12",
    borderColor: "#00D09C",
  },
  optText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#C5C8CE",
    marginRight: 12,
  },
  optTextActive: {
    color: "#00D09C",
    fontWeight: "600",
  },

  // ── Radio indicator ───────────────────────────────────────────────────────────
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#3A3A5E",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  radioActive: {
    borderColor: "#00D09C",
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#00D09C",
  },

  // ── Checkbox indicator ────────────────────────────────────────────────────────
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#3A3A5E",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  checkboxActive: {
    backgroundColor: "#00D09C",
    borderColor: "#00D09C",
  },
  checkmark: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0D0D1A",
    lineHeight: 15,
  },

  // ── Text / Number input ───────────────────────────────────────────────────────
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1A1A2E",
    borderWidth: 1.5,
    borderColor: "#2A2A3E",
    borderRadius: 14,
    overflow: "hidden",
    minHeight: 56,
  },
  currencyPrefix: {
    paddingLeft: 18,
    fontSize: 18,
    fontWeight: "600",
    color: "#00D09C",
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#EDEDED",
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
    backgroundColor: "#0D0D1A",
  },
  footerBtn: {
    width: "100%",
  },
});
