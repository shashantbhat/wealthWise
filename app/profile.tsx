import { clearExpenseStore } from "@/app/utils/expenseStorageOptimized";
import { resetUserContext } from "@/app/utils/userContextStorage";
import BackArrowIcon from "@/components/icons/back-button";
import { PrimaryButton } from "@/components/ui/primary-button";
import { SecondaryButton } from "@/components/ui/secondary-button";
import {
  useUser,
  type OnboardingData,
  type Profile,
} from "@/context/user-context";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
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

type FieldType =
  | "text"
  | "number"
  | "single_choice"
  | "multiple_choice"
  | "readonly";

interface FieldDef {
  id: string;
  label: string;
  section: string;
  type: FieldType;
  options?: string[];
  hint?: string;
  question: string;
}

const FIELDS: FieldDef[] = [
  // Personal
  {
    id: "user_name",
    label: "Full Name",
    section: "Personal",
    type: "text",
    question: "What's your name?",
  },
  {
    id: "age_group",
    label: "Age Group",
    section: "Personal",
    type: "single_choice",
    options: ["<18", "18-25", "26-35", "36-45", "46+"],
    question: "What is your age group?",
  },
  {
    id: "occupation",
    label: "Occupation",
    section: "Personal",
    type: "single_choice",
    options: [
      "Student",
      "Salaried Employee",
      "Self-employed",
      "Business Owner",
      "Freelancer",
      "Other",
    ],
    question: "What is your occupation?",
  },
  // Financial
  {
    id: "monthly_income",
    label: "Monthly Income",
    section: "Financial",
    type: "number",
    hint: "Amount after tax, in ₹",
    question: "What is your monthly income (after tax)?",
  },
  {
    id: "salary_day",
    label: "Salary Day",
    section: "Financial",
    type: "number",
    hint: "Day of month (1–31)",
    question: "Which day of the month do you receive your salary?",
  },
  {
    id: "payment_method",
    label: "Primary Payment Method",
    section: "Financial",
    type: "single_choice",
    options: ["Cash", "UPI", "Debit/Credit Card", "Mixed"],
    question: "What is your primary payment method?",
  },
  {
    id: "monthly_savings_rate",
    label: "Monthly Savings Rate",
    section: "Financial",
    type: "single_choice",
    options: ["0-10%", "10-20%", "20-30%", "30%+"],
    question: "What percentage of your income do you save monthly?",
  },
  {
    id: "base_currency",
    label: "Base Currency",
    section: "Financial",
    type: "readonly",
    question: "",
  },
  // Investments
  {
    id: "investment_knowledge_level",
    label: "Investment Knowledge",
    section: "Investments",
    type: "single_choice",
    options: ["Beginner", "Basic Knowledge", "Intermediate", "Advanced"],
    question: "How familiar are you with investments?",
  },
  {
    id: "current_savings_location",
    label: "Where You Save / Invest",
    section: "Investments",
    type: "multiple_choice",
    options: [
      "Savings Account",
      "Fixed Deposit",
      "Mutual Funds",
      "Stocks",
      "Crypto",
      "Gold",
      "No Investments",
    ],
    question: "Where do you keep most of your savings?",
  },
  // Goals
  {
    id: "financial_goals",
    label: "Financial Goals",
    section: "Goals",
    type: "multiple_choice",
    options: [
      "Buy a house",
      "Buy a car",
      "Education",
      "Travel",
      "Retirement",
      "Business investment",
      "Other",
    ],
    question: "What financial goals do you currently have?",
  },
  {
    id: "saving_for_goal",
    label: "Actively Saving for a Goal",
    section: "Goals",
    type: "single_choice",
    options: ["Yes", "No"],
    question: "Are you currently saving for this goal?",
  },
  // Risk
  {
    id: "risk_preference",
    label: "Risk Preference",
    section: "Risk",
    type: "single_choice",
    options: [
      "Low risk, low return",
      "Balanced risk and return",
      "High risk, high return",
    ],
    question: "What risk level do you prefer?",
  },
];

const SECTIONS = [
  "Personal",
  "Financial",
  "Investments",
  "Goals",
  "Risk",
] as const;

const RISK_TO_LEVEL: Record<string, string> = {
  "Low risk, low return": "Conservative",
  "Balanced risk and return": "Moderate",
  "High risk, high return": "Aggressive",
};

// ─── Value helpers ─────────────────────────────────────────────────────────────

function getCurrentValue(
  id: string,
  onboardingData: OnboardingData,
  profile: Profile,
): string | string[] | number {
  switch (id) {
    case "user_name":
      return onboardingData.userName;
    case "age_group":
      return onboardingData.ageGroup;
    case "occupation":
      return onboardingData.occupation;
    case "monthly_income":
      return onboardingData.monthlyIncome;
    case "salary_day":
      return profile.salaryDay;
    case "payment_method":
      return onboardingData.paymentMethod;
    case "monthly_savings_rate":
      return onboardingData.monthlySavingsRate;
    case "base_currency":
      return profile.baseCurrency;
    case "investment_knowledge_level":
      return onboardingData.investmentKnowledgeLevel;
    case "current_savings_location":
      return onboardingData.currentSavingsLocation;
    case "financial_goals":
      return onboardingData.financialGoals;
    case "saving_for_goal":
      return onboardingData.savingForGoal;
    case "risk_preference":
      return onboardingData.riskPreference;
    default:
      return "";
  }
}

function formatDisplayValue(
  id: string,
  value: string | string[] | number,
): string {
  if (value === undefined || value === null || value === "") return "Not set";
  if (Array.isArray(value))
    return value.length === 0 ? "Not set" : value.join(", ");
  if (typeof value === "number") {
    if (id === "monthly_income")
      return value > 0 ? `\u20B9${value.toLocaleString("en-IN")}` : "Not set";
    if (id === "salary_day") return `${value}`;
    return value === 0 ? "Not set" : String(value);
  }
  return (value as string) || "Not set";
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const { answers, setAnswers, onboardingData, profile, setProfile } =
    useUser();
  const router = useRouter();

  const [activeFieldId, setActiveFieldId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string | string[] | number>("");

  function openField(field: FieldDef) {
    if (field.type === "readonly") return;
    const current = getCurrentValue(field.id, onboardingData, profile);
    let initial: string | string[] | number;
    if (field.type === "multiple_choice") {
      initial = Array.isArray(current) ? [...current] : [];
    } else if (field.type === "number") {
      initial = typeof current === "number" ? current : 0;
    } else {
      initial = typeof current === "string" ? current : "";
    }
    setActiveFieldId(field.id);
    setEditValue(initial);
  }

  function cancelEdit() {
    setActiveFieldId(null);
    setEditValue("");
  }

  function saveField(field: FieldDef) {
    const id = field.id;

    if (id === "salary_day") {
      const day = Number(editValue);
      if (!day || day < 1 || day > 31) return;
      setProfile({ ...profile, salaryDay: day });
      setActiveFieldId(null);
      return;
    }

    if (id === "base_currency") return;

    const valueToSave: string | string[] | number =
      field.type === "number" ? Number(editValue) : editValue;

    setAnswers({ ...answers, [id]: valueToSave });

    const profileUpdates: Partial<Profile> = {};
    if (id === "user_name") profileUpdates.name = String(valueToSave);
    if (id === "occupation") profileUpdates.persona = String(valueToSave);
    if (id === "monthly_income")
      profileUpdates.monthlyIncome = Number(valueToSave);
    if (id === "risk_preference")
      profileUpdates.riskLevel =
        RISK_TO_LEVEL[String(valueToSave)] || "Moderate";

    if (Object.keys(profileUpdates).length > 0) {
      setProfile({ ...profile, ...profileUpdates });
    }

    setActiveFieldId(null);
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" />

      {/* ── Header ── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <BackArrowIcon size={18} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Profile</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {SECTIONS.map((section) => {
          const sectionFields = FIELDS.filter((f) => f.section === section);
          return (
            <View key={section} style={styles.section}>
              <Text style={styles.sectionLabel}>{section}</Text>
              <View style={styles.card}>
                {sectionFields.map((field, idx) => {
                  const isLast = idx === sectionFields.length - 1;
                  const isActive = activeFieldId === field.id;
                  const currentValue = getCurrentValue(
                    field.id,
                    onboardingData,
                    profile,
                  );
                  const displayValue = formatDisplayValue(
                    field.id,
                    currentValue,
                  );

                  return (
                    <View key={field.id}>
                      {/* ── Row ── */}
                      <TouchableOpacity
                        style={[
                          styles.fieldRow,
                          !isLast && !isActive && styles.fieldRowBorder,
                          isActive && styles.fieldRowActive,
                        ]}
                        onPress={() =>
                          isActive ? cancelEdit() : openField(field)
                        }
                        disabled={field.type === "readonly"}
                        activeOpacity={field.type === "readonly" ? 1 : 0.7}
                      >
                        <View style={styles.fieldInfo}>
                          <Text style={styles.fieldLabel}>{field.label}</Text>
                          <Text
                            style={[
                              styles.fieldValue,
                              displayValue === "Not set" &&
                                styles.fieldValueEmpty,
                            ]}
                            numberOfLines={2}
                          >
                            {displayValue}
                          </Text>
                        </View>
                        {field.type !== "readonly" && (
                          <Text
                            style={[
                              styles.fieldChevron,
                              isActive && styles.fieldChevronActive,
                            ]}
                          >
                            {"\u203A"}
                          </Text>
                        )}
                        {field.type === "readonly" && (
                          <View style={styles.readonlyBadge}>
                            <Text style={styles.readonlyBadgeText}>Fixed</Text>
                          </View>
                        )}
                      </TouchableOpacity>

                      {/* Edit Panel for the field */}
                      {isActive && (
                        <View
                          style={[styles.editPanel, styles.editPanelBorder]}
                        >
                          <Text style={styles.editQuestion}>
                            {field.question}
                          </Text>

                          {field.type === "text" && (
                            <>
                              <TextInput
                                style={styles.textInput}
                                placeholder={field.label}
                                value={String(editValue)}
                                onChangeText={setEditValue}
                                autoFocus
                              />
                              {field.hint && (
                                <Text style={styles.hintText}>
                                  {field.hint}
                                </Text>
                              )}
                            </>
                          )}

                          {field.type === "number" && (
                            <>
                              <TextInput
                                style={styles.textInput}
                                placeholder="0"
                                keyboardType="numeric"
                                value={String(editValue)}
                                onChangeText={setEditValue}
                                autoFocus
                              />
                              {field.hint && (
                                <Text style={styles.hintText}>
                                  {field.hint}
                                </Text>
                              )}
                            </>
                          )}

                          {field.type === "single_choice" && field.options && (
                            <View style={styles.chipsContainer}>
                              {field.options.map((option) => (
                                <TouchableOpacity
                                  key={option}
                                  style={[
                                    styles.chip,
                                    editValue === option && styles.chipSelected,
                                  ]}
                                  onPress={() => setEditValue(option)}
                                >
                                  <Text
                                    style={[
                                      styles.chipText,
                                      editValue === option &&
                                        styles.chipTextSelected,
                                    ]}
                                  >
                                    {option}
                                  </Text>
                                </TouchableOpacity>
                              ))}
                            </View>
                          )}

                          {field.type === "multiple_choice" &&
                            field.options && (
                              <>
                                <Text style={styles.multiHint}>
                                  Select one or more
                                </Text>
                                <View style={styles.chipsContainer}>
                                  {field.options.map((option) => {
                                    const isSelected = Array.isArray(editValue)
                                      ? editValue.includes(option)
                                      : false;
                                    return (
                                      <TouchableOpacity
                                        key={option}
                                        style={[
                                          styles.chip,
                                          isSelected && styles.chipSelected,
                                        ]}
                                        onPress={() => {
                                          if (Array.isArray(editValue)) {
                                            setEditValue(
                                              isSelected
                                                ? editValue.filter(
                                                    (v) => v !== option,
                                                  )
                                                : [...editValue, option],
                                            );
                                          }
                                        }}
                                      >
                                        <Text
                                          style={[
                                            styles.chipText,
                                            isSelected &&
                                              styles.chipTextSelected,
                                          ]}
                                        >
                                          {option}
                                        </Text>
                                      </TouchableOpacity>
                                    );
                                  })}
                                </View>
                              </>
                            )}

                          <View style={styles.editActions}>
                            <PrimaryButton
                              text="Save"
                              style={styles.actionBtn}
                              onPress={() => saveField(field)}
                            />
                            <SecondaryButton
                              text="Cancel"
                              style={styles.actionBtn}
                              onPress={cancelEdit}
                            />
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

        {/* Log Out Button */}
        <View style={styles.logoutButtonContainer}>
          <SecondaryButton
            text="Log Out"
            onPress={async () => {
              try {
                await resetUserContext();
                await clearExpenseStore();
                router.replace("/onboarding");
              } catch (error) {
                alert("Error logging out");
              }
            }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F4F4F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop:
      Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) + 8 : 4,
    paddingBottom: 12,
    backgroundColor: "#F4F4F6",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 22,
    marginRight: 16,
    backgroundColor: "rgba(0,0,0,0.07)",
    justifyContent: "center",
    alignItems: "center",
  },
  backBtnText: {
    fontSize: 30,
    color: "#1A1A1A",
    fontWeight: "300",
    marginTop: -2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1A1A1A",
    letterSpacing: -0.4,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  // ── Section ──
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#14B8A6",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  // ── Field row ──
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    backgroundColor: "#FFFFFF",
  },
  fieldRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.07)",
  },
  fieldRowActive: {
    backgroundColor: "#F5F5F5",
  },
  fieldInfo: {
    flex: 1,
    marginRight: 10,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#AAAAAA",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1A1A1A",
    lineHeight: 20,
  },
  fieldValueEmpty: {
    color: "#CCCCCC",
    fontWeight: "400",
    fontStyle: "italic",
  },
  fieldChevron: {
    fontSize: 22,
    color: "#CCCCCC",
    fontWeight: "300",
  },
  fieldChevronActive: {
    transform: [{ rotate: "90deg" }],
  },
  readonlyBadge: {
    backgroundColor: "rgba(0,0,0,0.05)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  readonlyBadgeText: {
    fontSize: 11,
    color: "#AAAAAA",
    fontWeight: "600",
  },

  // ── Edit panel ──
  editPanel: {
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 18,
  },
  editPanelBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(0,0,0,0.07)",
  },
  editQuestion: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A1A",
    marginBottom: 14,
    lineHeight: 22,
  },

  // Text / number input
  textInput: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.18)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1A1A1A",
    marginBottom: 6,
  },
  hintText: {
    fontSize: 12,
    color: "#AAAAAA",
    marginBottom: 12,
    fontStyle: "italic",
    marginLeft: 2,
  },
  multiHint: {
    fontSize: 12,
    color: "#AAAAAA",
    marginBottom: 10,
    fontStyle: "italic",
  },

  // Choice chips
  chipsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1.5,
    borderColor: "rgba(0,0,0,0.1)",
  },
  chipSelected: {
    backgroundColor: "#1A1A1A",
    borderColor: "#1A1A1A",
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#1A1A1A",
  },
  chipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "700",
  },

  // Action buttons
  editActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    minHeight: 44,
    paddingVertical: 0,
  },

  // Logout button
  logoutButtonContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    paddingBottom: 40,
  },
});
