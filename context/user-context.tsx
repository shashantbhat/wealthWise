import {
    loadUserContext,
    updateQuestionnaireAnswers,
    updateUserProfile
} from "@/app/utils/userContextStorage";
import React, {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";

// ─── Raw answer map type ───────────────────────────────────────────────────────
type RawAnswers = Record<string, string | string[] | number | boolean>;

// ─── Typed onboarding data derived from answers ───────────────────────────────
export interface OnboardingData {
  /** User's name */
  userName: string;
  /** Age bracket: "<18" | "18-25" | "26-35" | "36-45" | "46+" */
  ageGroup: string;
  /** Occupation type */
  occupation: string;
  /** Monthly income in base currency */
  monthlyIncome: number;
  /** Preferred payment method */
  paymentMethod: string;
  /** Monthly savings rate bracket e.g. "10-20%" */
  monthlySavingsRate: string;
  /** Self-rated investment knowledge level */
  investmentKnowledgeLevel: string;
  /** List of financial goals */
  financialGoals: string[];
  /** Whether user is actively saving for a goal */
  savingForGoal: string;
  /** Where current savings are held */
  currentSavingsLocation: string[];
  /** Risk appetite: "Low" | "Moderate" | "High" etc. */
  riskPreference: string;
}

// ─── Profile (manually set after questionnaire) ───────────────────────────────
export interface Profile {
  name: string;
  persona: string;
  monthlyIncome: number;
  salaryDay: number;
  riskLevel: string;
  baseCurrency: string;
}

// ─── Context shape ─────────────────────────────────────────────────────────────
interface UserContextType {
  /** Raw answer map keyed by question id */
  answers: RawAnswers;
  setAnswers: (answers: RawAnswers) => void;
  /** Typed, named onboarding data — derived from answers */
  onboardingData: OnboardingData;
  /** Structured profile (set at end of onboarding) */
  profile: Profile;
  setProfile: (profile: Profile) => void;
  /** Convenience shortcuts */
  userName: string;
  monthlyIncome: number;
  monthlySpent: number;
  addExpense: (amount: number) => void;
  resetSpent: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const DEFAULT_PROFILE: Profile = {
  name: "User",
  persona: "Student",
  monthlyIncome: 0,
  salaryDay: 1,
  riskLevel: "Moderate",
  baseCurrency: "INR",
};

const DEFAULT_ONBOARDING: OnboardingData = {
  userName: "",
  ageGroup: "",
  occupation: "",
  monthlyIncome: 0,
  paymentMethod: "",
  monthlySavingsRate: "",
  investmentKnowledgeLevel: "",
  financialGoals: [],
  savingForGoal: "",
  currentSavingsLocation: [],
  riskPreference: "",
};

// ─── Provider ──────────────────────────────────────────────────────────────────
export function UserProvider({ children }: { children: React.ReactNode }) {
  const [answers, setAnswersState] = useState<RawAnswers>({});
  const [monthlySpent, setMonthlySpent] = useState(0);
  const [profile, setProfileState] = useState<Profile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(true);

  // Load user context from storage on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        const context = await loadUserContext();
        // Convert questionnaire answers to RawAnswers format
        setAnswersState(context.questionnaireAnswers);
        // Set profile from stored context
        setProfileState({
          name: context.profile.name,
          persona: context.profile.persona,
          monthlyIncome: context.profile.monthlyIncome,
          salaryDay: context.profile.salaryDay,
          riskLevel: context.profile.riskLevel,
          baseCurrency: context.profile.baseCurrency,
        });
      } catch (error) {
        console.error("Error loading user context:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Wrapper to persist answers to storage
  const setAnswers = (newAnswers: RawAnswers) => {
    setAnswersState(newAnswers);
    updateQuestionnaireAnswers(newAnswers).catch((error) =>
      console.error("Error saving questionnaire answers:", error),
    );
  };

  // Wrapper to persist profile to storage
  const setProfile = (newProfile: Profile) => {
    setProfileState(newProfile);
    updateUserProfile({
      name: newProfile.name,
      persona: newProfile.persona,
      monthlyIncome: newProfile.monthlyIncome,
      salaryDay: newProfile.salaryDay,
      riskLevel: newProfile.riskLevel,
      baseCurrency: newProfile.baseCurrency,
    }).catch((error) => console.error("Error saving profile:", error));
  };

  // Derive typed onboarding data whenever answers change
  const onboardingData = useMemo<OnboardingData>(
    () => ({
      userName: (answers.user_name as string) || "",
      ageGroup: (answers.age_group as string) || "",
      occupation: (answers.occupation as string) || "",
      monthlyIncome: (answers.monthly_income as number) || 0,
      paymentMethod: (answers.payment_method as string) || "",
      monthlySavingsRate: (answers.monthly_savings_rate as string) || "",
      investmentKnowledgeLevel:
        (answers.investment_knowledge_level as string) || "",
      financialGoals: (answers.financial_goals as string[]) || [],
      savingForGoal: (answers.saving_for_goal as string) || "",
      currentSavingsLocation:
        (answers.current_savings_location as string[]) || [],
      riskPreference: (answers.risk_preference as string) || "",
    }),
    [answers],
  );

  const userName =
    profile.name !== "User" ? profile.name : onboardingData.userName || "User";
  const monthlyIncome = profile.monthlyIncome || onboardingData.monthlyIncome;

  const addExpense = (amount: number) =>
    setMonthlySpent((prev) => prev + amount);
  const resetSpent = () => setMonthlySpent(0);

  if (loading) {
    // Return a context with defaults while loading
    return (
      <UserContext.Provider
        value={{
          answers,
          setAnswers,
          onboardingData,
          profile,
          setProfile,
          userName,
          monthlyIncome,
          monthlySpent,
          addExpense,
          resetSpent,
        }}
      >
        {children}
      </UserContext.Provider>
    );
  }

  return (
    <UserContext.Provider
      value={{
        answers,
        setAnswers,
        onboardingData,
        profile,
        setProfile,
        userName,
        monthlyIncome,
        monthlySpent,
        addExpense,
        resetSpent,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

// ─── Hook ──────────────────────────────────────────────────────────────────────
export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within UserProvider");
  }
  return context;
}
