import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Questionnaire answers - raw responses from onboarding */
export interface QuestionnaireAnswers {
  user_name?: string;
  age_group?: string;
  occupation?: string;
  monthly_income?: number;
  payment_method?: string;
  monthly_savings_rate?: string;
  investment_knowledge_level?: string;
  financial_goals?: string[];
  saving_for_goal?: string;
  current_savings_location?: string[];
  risk_preference?: string;
  [key: string]: string | string[] | number | boolean | undefined;
}

/** User profile - structured data after questionnaire */
export interface UserProfile {
  name: string;
  persona: string;
  monthlyIncome: number;
  salaryDay: number;
  riskLevel: string;
  baseCurrency: string;
}

/** User preferences and settings */
export interface UserPreferences {
  theme?: "light" | "dark" | "auto";
  notifications?: boolean;
  currency?: string;
  language?: string;
  expenseReminders?: boolean;
  savingsGoalNotifications?: boolean;
  [key: string]: string | boolean | undefined;
}

/** Comprehensive user context - single source of truth */
export interface UserContext {
  // Questionnaire data (initial setup)
  questionnaireAnswers: QuestionnaireAnswers;

  // Profile (structured after questionnaire)
  profile: UserProfile;

  // Settings and preferences
  preferences: UserPreferences;

  // Timestamps
  createdAt: number; // When account was created
  updatedAt: number; // When profile was last updated
  lastModified: number; // Last context modification
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "wealthwise_user_context";

const DEFAULT_PROFILE: UserProfile = {
  name: "User",
  persona: "Student",
  monthlyIncome: 0,
  salaryDay: 1,
  riskLevel: "Moderate",
  baseCurrency: "INR",
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "auto",
  notifications: true,
  currency: "INR",
  language: "en",
  expenseReminders: true,
  savingsGoalNotifications: true,
};

const DEFAULT_USER_CONTEXT: UserContext = {
  questionnaireAnswers: {},
  profile: DEFAULT_PROFILE,
  preferences: DEFAULT_PREFERENCES,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  lastModified: Date.now(),
};

// ─── Load/Save Functions ──────────────────────────────────────────────────────

/**
 * Load user context from storage
 */
export async function loadUserContext(): Promise<UserContext> {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as UserContext;
      return parsed;
    }
    return DEFAULT_USER_CONTEXT;
  } catch (error) {
    console.error("Error loading user context:", error);
    return DEFAULT_USER_CONTEXT;
  }
}

/**
 * Save user context to storage
 */
async function saveUserContext(context: UserContext): Promise<void> {
  try {
    context.lastModified = Date.now();
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(context));
  } catch (error) {
    console.error("Error saving user context:", error);
    throw error;
  }
}

// ─── Questionnaire Functions ──────────────────────────────────────────────────

/**
 * Update questionnaire answers
 */
export async function updateQuestionnaireAnswers(
  answers: QuestionnaireAnswers,
): Promise<void> {
  const context = await loadUserContext();
  context.questionnaireAnswers = {
    ...context.questionnaireAnswers,
    ...answers,
  };
  context.updatedAt = Date.now();
  await saveUserContext(context);
}

/**
 * Get questionnaire answers
 */
export async function getQuestionnaireAnswers(): Promise<QuestionnaireAnswers> {
  const context = await loadUserContext();
  return context.questionnaireAnswers;
}

/**
 * Clear questionnaire (restart onboarding)
 */
export async function clearQuestionnaireAnswers(): Promise<void> {
  const context = await loadUserContext();
  context.questionnaireAnswers = {};
  await saveUserContext(context);
}

// ─── Profile Functions ────────────────────────────────────────────────────────

/**
 * Update user profile
 */
export async function updateUserProfile(
  profile: Partial<UserProfile>,
): Promise<void> {
  const context = await loadUserContext();
  context.profile = {
    ...context.profile,
    ...profile,
  };
  context.updatedAt = Date.now();
  await saveUserContext(context);
}

/**
 * Get user profile
 */
export async function getUserProfile(): Promise<UserProfile> {
  const context = await loadUserContext();
  return context.profile;
}

/**
 * Get monthly income (convenience function)
 */
export async function getMonthlyIncome(): Promise<number> {
  const profile = await getUserProfile();
  return profile.monthlyIncome;
}

/**
 * Update monthly income
 */
export async function updateMonthlyIncome(income: number): Promise<void> {
  await updateUserProfile({ monthlyIncome: income });
}

// ─── Preferences Functions ────────────────────────────────────────────────────

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  preferences: Partial<UserPreferences>,
): Promise<void> {
  const context = await loadUserContext();
  context.preferences = {
    ...context.preferences,
    ...preferences,
  };
  await saveUserContext(context);
}

/**
 * Get user preferences
 */
export async function getUserPreferences(): Promise<UserPreferences> {
  const context = await loadUserContext();
  return context.preferences;
}

/**
 * Get specific preference value
 */
export async function getPreference(
  key: keyof UserPreferences,
): Promise<string | boolean | undefined> {
  const preferences = await getUserPreferences();
  return preferences[key];
}

// ─── Full Context Functions ────────────────────────────────────────────────────

/**
 * Get complete user context
 */
export async function getFullUserContext(): Promise<UserContext> {
  return loadUserContext();
}

/**
 * Reset user context (completely)
 */
export async function resetUserContext(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

/**
 * Export user context as JSON
 */
export async function exportUserContextAsJSON(): Promise<string> {
  const context = await loadUserContext();
  return JSON.stringify(context, null, 2);
}

/**
 * Check if onboarding is complete
 */
export async function isOnboardingComplete(): Promise<boolean> {
  const context = await loadUserContext();
  return (
    context.questionnaireAnswers.user_name !== undefined &&
    context.questionnaireAnswers.user_name !== "" &&
    context.profile.monthlyIncome > 0
  );
}
